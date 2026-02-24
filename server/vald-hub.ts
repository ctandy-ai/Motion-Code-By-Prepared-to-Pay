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
  profileId: string;
  syncId?: string;
  givenName: string;
  familyName: string;
  email?: string;
  dateOfBirth?: string;
  externalId?: string;
}

interface ValdApiTest {
  testId: string;
  tenantId: string;
  profileId: string;
  recordingId?: string;
  modifiedDateUtc: string;
  recordedDateUtc: string;
  testType: string;
  notes?: string;
  weight?: number;
  parameter?: { resultId: number; value: number };
  extendedParameters?: Array<{ resultId: number; value: number }>;
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

const FORCEDECKS_METRICS: Record<number, { name: string; unit: string }> = {
  1: { name: 'Jump Height (Imp-Mom)', unit: 'cm' },
  2: { name: 'Jump Height (Flight Time)', unit: 'cm' },
  3: { name: 'Braking Phase Duration', unit: 'ms' },
  4: { name: 'Propulsive Phase Duration', unit: 'ms' },
  5: { name: 'Contraction Time', unit: 'ms' },
  6: { name: 'RSI-modified', unit: 'm/s' },
  7: { name: 'Peak Braking Force', unit: 'N' },
  8: { name: 'Peak Propulsive Force', unit: 'N' },
  9: { name: 'Peak Landing Force', unit: 'N' },
  10: { name: 'Force at Zero Velocity', unit: 'N' },
  11: { name: 'Peak Braking Velocity', unit: 'm/s' },
  12: { name: 'Peak Propulsive Velocity', unit: 'm/s' },
  13: { name: 'Peak Power', unit: 'W' },
  14: { name: 'Concentric Mean Force', unit: 'N' },
  15: { name: 'Eccentric Mean Force', unit: 'N' },
  16: { name: 'Concentric Peak Force', unit: 'N' },
  17: { name: 'Eccentric Peak Force', unit: 'N' },
  18: { name: 'Concentric Impulse', unit: 'N·s' },
  19: { name: 'Eccentric Impulse', unit: 'N·s' },
  20: { name: 'Concentric Mean Power', unit: 'W' },
  21: { name: 'Eccentric Mean Power', unit: 'W' },
  22: { name: 'Concentric Peak Power', unit: 'W' },
  23: { name: 'Body Weight', unit: 'kg' },
  24: { name: 'Concentric RFD', unit: 'N/s' },
  25: { name: 'Eccentric RFD', unit: 'N/s' },
  26: { name: 'Start of Movement', unit: 'ms' },
  27: { name: 'Countermovement Depth', unit: 'cm' },
  28: { name: 'Braking Phase Mean Force', unit: 'N' },
  29: { name: 'Force at Peak Power', unit: 'N' },
  30: { name: 'Velocity at Peak Power', unit: 'm/s' },
  31: { name: 'L/R Braking Force Asymmetry', unit: '%' },
  32: { name: 'L/R Propulsive Force Asymmetry', unit: '%' },
  33: { name: 'L/R Landing Force Asymmetry', unit: '%' },
  34: { name: 'L/R Impulse Asymmetry', unit: '%' },
  35: { name: 'Peak Braking Power', unit: 'W' },
  36: { name: 'Concentric Duration', unit: 'ms' },
  37: { name: 'Eccentric Duration', unit: 'ms' },
  38: { name: 'Landing Phase Duration', unit: 'ms' },
  39: { name: 'Relative Concentric Peak Force', unit: 'N/kg' },
  40: { name: 'Relative Concentric Peak Power', unit: 'W/kg' },
};

type ValdRegion = 'AUE' | 'EUW' | 'USE';

const VALD_REGIONS: Record<ValdRegion, { name: string; regionCode: string }> = {
  AUE: { name: 'Australia', regionCode: 'aue' },
  EUW: { name: 'Europe', regionCode: 'euw' },
  USE: { name: 'North America', regionCode: 'use' },
};

const VALD_SERVICE_URLS: Record<string, string> = {
  tenants: 'externaltenants',
  profile: 'externalprofile',
  forcedecks: 'extforcedecks',
  nordbord: 'externalnordbord',
  dynamo: 'externaldynamo',
  smartspeed: 'externalsmartspeed',
  forceframe: 'externalforceframe',
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
  private region: ValdRegion = 'USE';
  private tenantId: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    this.clientId = process.env.VALD_CLIENT_ID || null;
    this.clientSecret = process.env.VALD_CLIENT_SECRET || null;
    this.tenantId = process.env.VALD_TENANT_ID || null;

    const regionEnv = (process.env.VALD_REGION || '').toLowerCase();
    if (regionEnv === 'australia' || regionEnv === 'aue') {
      this.region = 'AUE';
    } else if (regionEnv === 'europe' || regionEnv === 'euw') {
      this.region = 'EUW';
    } else if (regionEnv === 'north america' || regionEnv === 'use' || regionEnv === 'us') {
      this.region = 'USE';
    } else {
      this.region = 'USE';
    }
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
    const regionCode = VALD_REGIONS[this.region].regionCode;
    const serviceSuffix = VALD_SERVICE_URLS[service] || `external${service}`;
    return `https://prd-${regionCode}-api-${serviceSuffix}.valdperformance.com${path}`;
  }

  private async apiRequest<T>(service: string, path: string, params?: Record<string, string>): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(this.getApiUrl(service, path));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log(`VALD API request: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 204) {
      return [] as unknown as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VALD API error (${url.hostname}${path}): ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getTenantId(): Promise<string> {
    if (this.tenantId) {
      return this.tenantId;
    }

    const tenants = await this.apiRequest<Array<{ id: string; name: string }>>('tenants', '/tenants');
    
    if (tenants.length === 0) {
      throw new Error('No VALD tenants found for this account');
    }

    this.tenantId = tenants[0].id;
    return this.tenantId;
  }

  async getProfiles(): Promise<ValdApiProfile[]> {
    const tenantId = await this.getTenantId();
    const response = await this.apiRequest<any>('profile', '/profiles', { tenantId });
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object' && Array.isArray(response.profiles)) {
      return response.profiles;
    }
    console.warn('VALD profiles response unexpected format:', JSON.stringify(response).substring(0, 500));
    return [];
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
      modifiedFromUtc: modifiedFromUtc || '2020-01-01T00:00:00.000Z',
    };

    return this.parseTestsResponse(
      await this.apiRequest<any>(deviceType, '/tests', params)
    );
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

  async getTestResults(
    testId: string,
    deviceType: ValdDeviceType = 'forcedecks'
  ): Promise<ValdApiTrial[]> {
    try {
      const tenantId = await this.getTenantId();
      const response = await this.apiRequest<any>(
        deviceType,
        `/tests/${testId}/trials`,
        { tenantId }
      );
      if (Array.isArray(response)) return response;
      if (response?.trials && Array.isArray(response.trials)) return response.trials;
      return [];
    } catch (err: any) {
      console.log(`VALD trials fetch failed for test ${testId}: ${err.message?.substring(0, 200)}`);
      return [];
    }
  }

  async getAllTestsWithResults(
    deviceType: ValdDeviceType = 'forcedecks',
    modifiedFromUtc?: string
  ): Promise<ValdApiTest[]> {
    const tenantId = await this.getTenantId();
    const params: Record<string, string> = {
      tenantId,
      modifiedFromUtc: modifiedFromUtc || '2020-01-01T00:00:00.000Z',
      includeResults: 'true',
    };

    return this.parseTestsResponse(
      await this.apiRequest<any>(deviceType, '/tests', params)
    );
  }

  async getAllTests(
    deviceType: ValdDeviceType = 'forcedecks',
    modifiedFromUtc?: string
  ): Promise<ValdApiTest[]> {
    const tenantId = await this.getTenantId();
    const params: Record<string, string> = {
      tenantId,
      modifiedFromUtc: modifiedFromUtc || '2020-01-01T00:00:00.000Z',
    };

    return this.parseTestsResponse(
      await this.apiRequest<any>(deviceType, '/tests', params)
    );
  }

  private parseTestsResponse(response: any): ValdApiTest[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object' && Array.isArray(response.tests)) {
      return response.tests;
    }
    console.warn('VALD tests response unexpected format:', JSON.stringify(response).substring(0, 500));
    return [];
  }

  transformProfileToInsert(profile: ValdApiProfile, tenantId: string): InsertValdProfile {
    if (!profile.profileId) {
      console.warn('VALD profile missing profileId:', JSON.stringify(profile).substring(0, 300));
      throw new Error('VALD profile missing required profileId field');
    }
    
    return {
      valdProfileId: profile.profileId,
      valdTenantId: tenantId,
      firstName: profile.givenName || '',
      lastName: profile.familyName || '',
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
      valdTestId: test.testId,
      testType: test.testType || deviceType,
      deviceType,
      testName: test.testType,
      recordedAt: new Date(test.recordedDateUtc),
      metadata: JSON.stringify({
        tenantId: test.tenantId,
        recordingId: test.recordingId,
        weight: test.weight,
        notes: test.notes,
      }),
    };
  }

  extractMetricsFromTest(test: ValdApiTest, valdTestId: string): InsertValdTrialResult[] {
    const results: InsertValdTrialResult[] = [];
    const params = test.extendedParameters || [];
    if (test.parameter) {
      params.unshift(test.parameter);
    }
    for (const param of params) {
      const def = FORCEDECKS_METRICS[param.resultId];
      if (!def) continue;
      if (results.some(r => r.metricName === def.name)) continue;
      results.push({
        valdTestId,
        trialNumber: 1,
        limb: 'both',
        metricName: def.name,
        metricValue: param.value,
        metricUnit: def.unit,
        startTime: null,
        endTime: null,
      });
    }
    return results;
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
