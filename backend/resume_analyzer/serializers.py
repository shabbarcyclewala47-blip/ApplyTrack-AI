
from rest_framework import serializers

from .models import Resume, ResumeAnalysis, JobMatch


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "title",
            "template",
            "personal_info",
            "summary",
            "experience",
            "education",
            "skills",
            "projects",
            "certifications",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ResumeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = [
            "id",
            "resume",
            "uploaded_filename",
            "word_count",
            "page_count",
            "score",
            "strengths",
            "weaknesses",
            "suggestions",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class JobMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobMatch
        fields = [
            "id",
            "resume",
            "job_title",
            "company_name",
            "job_description",
            "match_score",
            "matching_skills",
            "missing_skills",
            "recommendations",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
