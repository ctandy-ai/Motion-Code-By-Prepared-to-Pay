import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header";
import type { Exercise } from "@shared/schema";

const getBeltColor = (beltLevel: string) => {
  switch (beltLevel) {
    case "white": return "bg-gray-500";
    case "blue": return "bg-blue-500";
    case "black": return "bg-gray-900";
    default: return "bg-gray-500";
  }
};

export default function ExerciseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: exercise, isLoading } = useQuery<Exercise>({
    queryKey: ["/api/exercises", id],
    queryFn: async () => {
      const response = await fetch(`/api/exercises/${id}`);
      if (!response.ok) throw new Error('Failed to fetch exercise');
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">Exercise not found</p>
              <Button onClick={() => setLocation("/")} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exercises
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exercises
        </Button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Exercise Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-6 h-6 rounded-full ${getBeltColor(exercise.beltLevel)}`}></div>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {exercise.beltLevel} Belt
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exercise.name}</h1>
              <p className="text-lg text-gray-600">{exercise.category}</p>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900">Duration</span>
                </div>
                <p className="text-gray-600">{exercise.duration}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Dumbbell className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900">Equipment</span>
                </div>
                <p className="text-gray-600">{exercise.equipment}</p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{exercise.description}</p>
          </div>

          {/* Coaching Cues */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Coaching Cues</h3>
            <ul className="space-y-2">
              {exercise.coachingCues.map((cue, index) => (
                <li key={index} className="flex items-start space-x-2 text-blue-800">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3">
              Add to Program
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="text-lg font-bold">Prepared to Play</div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">Professional Exercise Programming</span>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-right">
              <p>Leg Power for Running Performance & Injury Prevention</p>
              <p className="mt-1">© 2025 Prepared to Play. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
