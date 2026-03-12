"""Quiz API: CRUD for quizzes, questions, answers; submit quiz."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.deps import CurrentUser, require_teacher_or_admin
from app.database import get_session
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, Question, Answer, QuizAttempt
from app.models.user import User
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizResponseStudent,
    QuestionCreate, QuestionUpdate, QuestionResponse, QuestionResponseStudent,
    AnswerCreate, AnswerUpdate, AnswerResponse, AnswerResponseStudent,
    QuizSubmit, QuizAttemptResponse, QuizResultResponse,
)

router = APIRouter(tags=["quizzes"])


def _get_lesson_with_access_check(lesson_id: int, user: User, session: Session) -> Lesson:
    """Get lesson and verify user can access it."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


def _can_manage_quiz(user: User, lesson: Lesson, session: Session) -> bool:
    """Check if user can create/edit quiz for this lesson."""
    if user.role == "admin":
        return True
    if user.role == "teacher":
        course = session.get(Course, lesson.course_id)
        return course and course.teacher_id == user.id
    return False


def _is_enrolled(user: User, course_id: int, session: Session) -> bool:
    """Check if student is enrolled in the course."""
    if user.role in ("teacher", "admin"):
        return True
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == user.id,
            Enrollment.course_id == course_id
        )
    ).first()
    return enrollment is not None


def _build_quiz_response(quiz: Quiz, session: Session) -> QuizResponse:
    """Build full quiz response with questions and answers."""
    questions = session.exec(
        select(Question).where(Question.quiz_id == quiz.id).order_by(Question.order, Question.id)
    ).all()
    
    question_responses = []
    for q in questions:
        answers = session.exec(
            select(Answer).where(Answer.question_id == q.id).order_by(Answer.order, Answer.id)
        ).all()
        question_responses.append(QuestionResponse(
            id=q.id,
            quiz_id=q.quiz_id,
            text_ru=q.text_ru,
            text_kz=q.text_kz,
            order=q.order,
            answers=[AnswerResponse.model_validate(a) for a in answers]
        ))
    
    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        passing_score=quiz.passing_score,
        created_at=quiz.created_at,
        questions=question_responses
    )


def _build_quiz_response_student(quiz: Quiz, session: Session) -> QuizResponseStudent:
    """Build quiz response for students (without correct answers)."""
    questions = session.exec(
        select(Question).where(Question.quiz_id == quiz.id).order_by(Question.order, Question.id)
    ).all()
    
    question_responses = []
    for q in questions:
        answers = session.exec(
            select(Answer).where(Answer.question_id == q.id).order_by(Answer.order, Answer.id)
        ).all()
        question_responses.append(QuestionResponseStudent(
            id=q.id,
            quiz_id=q.quiz_id,
            text_ru=q.text_ru,
            text_kz=q.text_kz,
            order=q.order,
            answers=[AnswerResponseStudent(
                id=a.id,
                question_id=a.question_id,
                text_ru=a.text_ru,
                text_kz=a.text_kz,
                order=a.order
            ) for a in answers]
        ))
    
    return QuizResponseStudent(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        passing_score=quiz.passing_score,
        questions=question_responses
    )


# ===== Quiz CRUD =====

@router.post("/lessons/{lesson_id}/quiz", response_model=QuizResponse)
def create_quiz(
    lesson_id: int,
    body: QuizCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Create a quiz for a lesson. Teacher (own course) or admin only."""
    require_teacher_or_admin(current_user)
    lesson = _get_lesson_with_access_check(lesson_id, current_user, session)
    
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to create quiz for this lesson")
    
    # Check if quiz already exists
    existing = session.exec(select(Quiz).where(Quiz.lesson_id == lesson_id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Quiz already exists for this lesson")
    
    quiz = Quiz(
        lesson_id=lesson_id,
        title=body.title,
        passing_score=body.passing_score,
        created_at=datetime.utcnow()
    )
    session.add(quiz)
    session.commit()
    session.refresh(quiz)
    
    return _build_quiz_response(quiz, session)


@router.get("/lessons/{lesson_id}/quiz", response_model=QuizResponse | QuizResponseStudent)
def get_quiz_by_lesson(
    lesson_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get quiz for a lesson. Returns full quiz for teacher/admin, limited for students."""
    lesson = _get_lesson_with_access_check(lesson_id, current_user, session)
    
    if not _is_enrolled(current_user, lesson.course_id, session):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    quiz = session.exec(select(Quiz).where(Quiz.lesson_id == lesson_id)).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found for this lesson")
    
    # Teachers and admins see correct answers
    if _can_manage_quiz(current_user, lesson, session):
        return _build_quiz_response(quiz, session)
    
    # Students don't see correct answers
    return _build_quiz_response_student(quiz, session)


@router.patch("/quizzes/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    body: QuizUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update quiz. Teacher (own course) or admin only."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to update this quiz")
    
    if body.title is not None:
        quiz.title = body.title
    if body.passing_score is not None:
        quiz.passing_score = body.passing_score
    
    session.add(quiz)
    session.commit()
    session.refresh(quiz)
    
    return _build_quiz_response(quiz, session)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete quiz. Teacher (own course) or admin only."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to delete this quiz")
    
    session.delete(quiz)
    session.commit()


# ===== Question CRUD =====

@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionResponse)
def create_question(
    quiz_id: int,
    body: QuestionCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Add question to quiz with optional answers."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to add questions to this quiz")
    
    question = Question(
        quiz_id=quiz_id,
        text_ru=body.text_ru,
        text_kz=body.text_kz,
        order=body.order
    )
    session.add(question)
    session.commit()
    session.refresh(question)
    
    # Create answers if provided
    answers = []
    for ans_data in body.answers:
        answer = Answer(
            question_id=question.id,
            text_ru=ans_data.text_ru,
            text_kz=ans_data.text_kz,
            is_correct=ans_data.is_correct,
            order=ans_data.order
        )
        session.add(answer)
        answers.append(answer)
    
    if answers:
        session.commit()
        for a in answers:
            session.refresh(a)
    
    return QuestionResponse(
        id=question.id,
        quiz_id=question.quiz_id,
        text_ru=question.text_ru,
        text_kz=question.text_kz,
        order=question.order,
        answers=[AnswerResponse.model_validate(a) for a in answers]
    )


@router.patch("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    body: QuestionUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update question text or order."""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    quiz = session.get(Quiz, question.quiz_id)
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to update this question")
    
    if body.text_ru is not None:
        question.text_ru = body.text_ru
    if body.text_kz is not None:
        question.text_kz = body.text_kz
    if body.order is not None:
        question.order = body.order
    
    session.add(question)
    session.commit()
    session.refresh(question)
    
    answers = session.exec(select(Answer).where(Answer.question_id == question.id)).all()
    return QuestionResponse(
        id=question.id,
        quiz_id=question.quiz_id,
        text_ru=question.text_ru,
        text_kz=question.text_kz,
        order=question.order,
        answers=[AnswerResponse.model_validate(a) for a in answers]
    )


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete question (cascades to answers)."""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    quiz = session.get(Quiz, question.quiz_id)
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to delete this question")
    
    session.delete(question)
    session.commit()


# ===== Answer CRUD =====

@router.post("/questions/{question_id}/answers", response_model=AnswerResponse)
def create_answer(
    question_id: int,
    body: AnswerCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Add answer option to question."""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    quiz = session.get(Quiz, question.quiz_id)
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to add answers")
    
    answer = Answer(
        question_id=question_id,
        text_ru=body.text_ru,
        text_kz=body.text_kz,
        is_correct=body.is_correct,
        order=body.order
    )
    session.add(answer)
    session.commit()
    session.refresh(answer)
    
    return AnswerResponse.model_validate(answer)


@router.patch("/answers/{answer_id}", response_model=AnswerResponse)
def update_answer(
    answer_id: int,
    body: AnswerUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update answer option."""
    answer = session.get(Answer, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    question = session.get(Question, answer.question_id)
    quiz = session.get(Quiz, question.quiz_id)
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to update this answer")
    
    if body.text_ru is not None:
        answer.text_ru = body.text_ru
    if body.text_kz is not None:
        answer.text_kz = body.text_kz
    if body.is_correct is not None:
        answer.is_correct = body.is_correct
    if body.order is not None:
        answer.order = body.order
    
    session.add(answer)
    session.commit()
    session.refresh(answer)
    
    return AnswerResponse.model_validate(answer)


@router.delete("/answers/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_answer(
    answer_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete answer option."""
    answer = session.get(Answer, answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    question = session.get(Question, answer.question_id)
    quiz = session.get(Quiz, question.quiz_id)
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _can_manage_quiz(current_user, lesson, session):
        raise HTTPException(status_code=403, detail="Not allowed to delete this answer")
    
    session.delete(answer)
    session.commit()


# ===== Check Single Answer =====

class CheckAnswerRequest(BaseModel):
    answer_id: int


class CheckAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer_id: int


@router.post("/questions/{question_id}/check", response_model=CheckAnswerResponse)
def check_answer(
    question_id: int,
    body: CheckAnswerRequest,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Check if selected answer is correct. Returns correct answer after check."""
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    quiz = session.get(Quiz, question.quiz_id)
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _is_enrolled(current_user, lesson.course_id, session):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Get selected answer
    selected = session.get(Answer, body.answer_id)
    if not selected or selected.question_id != question_id:
        raise HTTPException(status_code=400, detail="Invalid answer")
    
    # Find correct answer
    correct = session.exec(
        select(Answer).where(Answer.question_id == question_id, Answer.is_correct == True)
    ).first()
    
    return CheckAnswerResponse(
        is_correct=selected.is_correct,
        correct_answer_id=correct.id if correct else body.answer_id
    )


# ===== Submit Quiz =====

@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz(
    quiz_id: int,
    body: QuizSubmit,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Submit quiz answers and get result."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    lesson = session.get(Lesson, quiz.lesson_id)
    if not _is_enrolled(current_user, lesson.course_id, session):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Get all questions
    questions = session.exec(select(Question).where(Question.quiz_id == quiz_id)).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")
    
    # Calculate score
    correct_count = 0
    for q in questions:
        selected_answer_id = body.answers.get(q.id)
        if selected_answer_id:
            answer = session.get(Answer, selected_answer_id)
            if answer and answer.question_id == q.id and answer.is_correct:
                correct_count += 1
    
    total = len(questions)
    score = int((correct_count / total) * 100) if total > 0 else 0
    passed = score >= quiz.passing_score
    
    # Create attempt record
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        score=score,
        passed=passed,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    session.add(attempt)
    session.commit()
    session.refresh(attempt)
    
    return QuizResultResponse(
        attempt_id=attempt.id,
        score=score,
        passed=passed,
        total_questions=total,
        correct_answers=correct_count
    )


@router.get("/quizzes/{quiz_id}/my-attempts", response_model=list[QuizAttemptResponse])
def get_my_quiz_attempts(
    quiz_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get current user's attempts for a quiz."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    attempts = session.exec(
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.student_id == current_user.id)
        .order_by(QuizAttempt.started_at.desc())
    ).all()
    
    return [QuizAttemptResponse.model_validate(a) for a in attempts]
