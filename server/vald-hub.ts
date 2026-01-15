import type {
  ValdProfile, InsertValdProfile,
  ValdTest, InsertValdTest,
  ValdTrialResult, InsertValdTrialResult,
  ValdSyncLog, InsertValdSyncLog,
} from "@shared/schema";

interface ValdTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ValdApiProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string;
}

interface ValdApiTest {
  id: string;
  profileId: string;
  testTypeId: string;
  testTypeName: string;
  recordedUtc: string;
  teamId?: string;
}

interface ValdApiTrial {
  id: string;
  startTime: number;
  endTime: number;
  limb: string;
  results: Array<{
    resultId: number;
    value: number;
    time: number;
    limb: string;
    definition: {
      result: string;
      name: string;
      unit: string;
    };
  }>;
}

type ValdRegion = 'AUE' | 'WEU' | 'EUS';

const VALD_REGIONS: Record<ValdRegion, { name: string; baseUrl: string }> = {
  AUE: { name: 'Australia', baseUrl: 'prd-aue-api' },
  WEU: { name: 'Europe', baseUrl: 'prd-weu-api' },
  EUS: { name: 'North America', baseUrl: 'prd-eus-api' },
};

const VALD_DEVICE_TYPES = [
  'forcedecks',
  'nordbord', 
  'dynamo',
  'smartspeed',
  'airband',
  'humantrak',
] as const;

type ValdDeviceType = typeof VALD_DEVICE_TYPES[number];

class ValdHubService {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private region: ValdRegion = 'EUS';
  private tenantId: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    this.clientId = process.env.VALD_CLIENT_ID || null;
    this.clientSecret = process.env.VALD_CLIENT_SECRET || null;
    this.region = (process.env.VALD_REGION as ValdRegion) || 'EUS';
    this.tenantId = process.env.VALD_TENANT_ID || null;
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getConfiguration(): { isConfigured: boolean; region: string; hasTenantId: boolean } {
    return {
      isConfigured: this.isConfigured(),
      region: VALD_REGIONS[this.region].name,
      hasTenantId: !!this.tenantId,
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('VALD Hub credentials not configured');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);

    const response = await fetch('https://security.valdperformance.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VALD authentication failed: ${response.status} - ${errorText}`);
    }

    const data: ValdTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }

  private getApiUrl(service: string, path: string): string {
    const baseUrl = VALD_REGIONS[this.region].baseUrl;
    return `https://${baseUrl}-external${service}.valdperformance.com${path}`;
  }

  private async apiRequest<T>(service: string, path: string, params?: Record<string, string>): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(this.getApiUrl(service, path));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VALD API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getTenantId(): Promise<string> {
    if (this.tenantId) {
      return this.tenantId;
    }

    const tenants = await this.apiRequest<Array<{ id: string; name: string }>>('tenant', '/tenants');
    
    if (tenants.length === 0) {
      throw new Error('No VALD tenants found for this account');
    }

    this.tenantId = tenants[0].id;
    return this.tenantId;
  }

  async getProfiles(): Promise<ValdApiProfile[]> {
    const tenantId = await this.getTenantId();
    return this.apiRequest<ValdApiProfile[]>('profile', '/profiles', { tenantId });
  }

  async getTestsForProfile(
    profileId: string, 
    deviceType: ValdDeviceType = 'forcedecks',
    modifiedFromUtc?: string
  ): Promise<ValdApiTest[]> {
    const tenantId = await this.getTenantId();
    const params: Record<string, string> = {
      tenantId,
      profileId,
    };
    
    if (modifiedFromUtc) {
      params.modifiedFromUtc = modifiedFromUtc;
    }

    return this.apiRequest<ValdApiTest[]>(deviceType, '/tests', params);
  }

  async getTrialsForTest(
    testId: string,
    teamId: string,
    deviceType: ValdDeviceType = 'forcedecks'
  ): Promise<ValdApiTrial[]> {
    return this.apiRequest<ValdApiTrial[]>(
      deviceType, 
      `/v2019q3/teams/${teamId}/tests/${testId}/trials`
    );
  }

  async getAllTests(
    deviceType: ValdDeviceType = 'forcedecks',
    modifiedFromUtc?: string
  ): Promise<ValdApiTest[]> {
    const tenantId = await this.getTenantId();
    const params: Record<string, string> = { tenantId };
    
    if (modifiedFromUtc) {
      params.modifiedFromUtc = modifiedFromUtc;
    }

    return this.apiRequest<ValdApiTest[]>(deviceType, '/tests', params);
  }

  transformProfileToInsert(profile: ValdApiProfile, tenantId: string): InsertValdProfile {
    return {
      valdProfileId: profile.id,
      valdTenantId: tenantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email || null,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
      athleteId: null,
    };
  }

  transformTestToInsert(
    test: ValdApiTest, 
    valdProfileId: string, 
    athleteId: string | null,
    deviceType: ValdDeviceType
  ): InsertValdTest {
    return {
      valdProfileId,
      athleteId,
      valdTestId: test.id,
      testType: test.testTypeName || test.testTypeId,
      deviceType,
      testName: test.testTypeName,
      recordedAt: new Date(test.recordedUtc),
      metadata: JSON.stringify({ teamId: test.teamId }),
    };
  }

  transformTrialToInserts(trial: ValdApiTrial, valdTestId: string, trialNumber: number): InsertValdTrialResult[] {
    return trial.results.map(result => ({
      valdTestId,
      trialNumber,
      limb: result.limb || trial.limb,
      metricName: result.definition.name,
      metricValue: result.value,
      metricUnit: result.definition.unit,
      startTime: trial.startTime,
      endTime: trial.endTime,
    }));
  }
}

export const valdHubService = new ValdHubService();

export type { 
  ValdApiProfile, 
  ValdApiTest, 
  ValdApiTrial, 
  ValdDeviceType,
  ValdRegion 
};
