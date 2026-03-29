from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(["GET"])
def health_check(request):
    """
    Simple health check endpoint for monitoring and frontend to verify API is alive.
    """
    data = {
        "status": "ok",
        "message": "API is healthy",
    }
    return Response(data, status=status.HTTP_200_OK)
