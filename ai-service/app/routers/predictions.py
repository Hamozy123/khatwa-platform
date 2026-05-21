from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PredictionRequest(BaseModel):
    student_id: int
    recent_progress: list[int]
    attendance_rate: Optional[float] = None
    behavior_score: Optional[float] = None


class PredictionResponse(BaseModel):
    student_id: int
    predicted_progress: int
    risk_level: str
    alert: Optional[str] = None


@router.post("/predict-progress", response_model=PredictionResponse)
def predict_progress(req: PredictionRequest):
    values = req.recent_progress
    if not values:
        return PredictionResponse(
            student_id=req.student_id,
            predicted_progress=50,
            risk_level="unknown",
            alert="لا توجد بيانات كافية للتنبؤ",
        )

    recent_avg = sum(values) / len(values)
    trend = values[-1] - values[0] if len(values) >= 2 else 0
    predicted = min(100, max(0, recent_avg + trend))

    risk = "low"
    alert = None
    if predicted < 30:
        risk = "high"
        alert = "الطالب معرض لخطر تدنّي الأداء. يوصى بتدخل فوري."
    elif predicted < 50:
        risk = "medium"
        alert = "أداء الطالب دون المتوسط. يوصى بمراجعة الخطة."

    return PredictionResponse(
        student_id=req.student_id,
        predicted_progress=round(predicted),
        risk_level=risk,
        alert=alert,
    )
