import { Injectable } from '@nestjs/common';
import type { IMlRecommendationPort, MlRecommendRequest, MlRecommendResponse } from '../ports/ml-recommendation.port';

@Injectable()
export class MlRecommendationClient implements IMlRecommendationPort {
  private readonly mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';

  async recommend(payload: MlRecommendRequest): Promise<MlRecommendResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(`${this.mlApiUrl}/recommend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`ML service responded with ${response.status}`);
      return (await response.json()) as MlRecommendResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
}
