import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt




DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'data.json')

@csrf_exempt

def test_api(request):
    data = {
        "message": "API working",
        "status": "success"
    }
    return JsonResponse(data)

def ask_question(request):
    question = request.GET.get('q', '').lower()

    if not question:
        return JsonResponse({"error": "Question not provided"})

    with open(DATA_PATH, 'r', encoding='utf-8') as file:
        data = json.load(file)

    for key in data:
        if key in question:
            return JsonResponse({
                "question": question,
                "answer": data[key]
            })

    return JsonResponse({
        "question": question,
        "answer": "Sorry, I don't have verified information on this."
    })

