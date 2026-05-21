from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RecommendationRequest(BaseModel):
    student_id: int
    disability_type: Optional[str] = None
    goal_status: Optional[str] = None
    current_progress: Optional[int] = None


class RecommendationResponse(BaseModel):
    student_id: int
    recommendations: list[dict]


MEDIA_RULES = {
    "autism": [
        {"type": "video", "title": "فيديو تفاعلي بصري", "reason": "مناسب للمتعلمين البصريين"},
        {"type": "visual_schedule", "title": "جدول مصور", "reason": "يدعم الروتين والتوقع"},
        {"type": "social_story", "title": "قصة اجتماعية مصورة", "reason": "تطوير المهارات الاجتماعية"},
    ],
    "adhd": [
        {"type": "game", "title": "نشاط حركي قصير", "reason": "تفريغ الطاقة وزيادة التركيز"},
        {"type": "timer", "title": "مؤقت بصري", "reason": "إدارة الوقت"},
        {"type": "interactive", "title": "تمرين تفاعلي مجزّأ", "reason": "تقسيم المهام"},
    ],
    "learning_disability": [
        {"type": "worksheet", "title": "ورقة عمل مبسّطة", "reason": "محتوى مناسب لمستوى الطالب"},
        {"type": "audio", "title": "تسجيل صوتي للدرس", "reason": "دعم سمعي"},
        {"type": "visual_aid", "title": "بطاقات تعليمية", "reason": "تعزيز الحفظ البصري"},
    ],
    "physical": [
        {"type": "adapted_tool", "title": "أداة تعليمية مكيّفة", "reason": "تناسب الاحتياجات الحركية"},
        {"type": "large_print", "title": "مادة بخط كبير", "reason": "تسهيل القراءة"},
    ],
}


@router.post("/recommend-media", response_model=RecommendationResponse)
def recommend_media(req: RecommendationRequest):
    disability = (req.disability_type or "").lower()
    rules = MEDIA_RULES.get(disability)

    if not rules:
        rules = [
            {"type": "general", "title": "نشاط تعليمي عام", "reason": "توصية عامة"},
            {"type": "review", "title": "مراجعة سريعة", "reason": "تثبيت المعلومات"},
        ]

    if req.current_progress is not None and req.current_progress < 30:
        rules = [r for r in rules if r["type"] not in ("game", "interactive")]

    return RecommendationResponse(
        student_id=req.student_id,
        recommendations=rules,
    )
