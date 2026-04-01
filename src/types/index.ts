export type DIYFeasibility = 'EASY' | 'MEDIUM' | 'HARD' | 'DO_NOT_ATTEMPT' | 'UNKNOWN';

export interface AIAnalysisResult {
  is_relevant: boolean;
  rejection_reason: string;
  identification: string;
  solution: string;
  diy_feasibility: DIYFeasibility;
  dangers: string;
  confidence: number;
  required_tools: string[];
  recommended_expert: string;
}

export interface TaskResponse {
  task_id: string;
  status: 'PENDING' | 'STARTED' | 'completed' | 'failed';
  result?: {
    data: AIAnalysisResult;
    b2b: {
      expert_number: string;
      shop_links: string[];
    };
    latency: number;
  };
  error?: string;
}

export type RootStackParamList = {
  Home: undefined;
};
