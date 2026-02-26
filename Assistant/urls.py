from django.urls import path
from .views import ask_question, test_api

urlpatterns = [
    path('ask/', ask_question),
    path('test/', test_api),
]
