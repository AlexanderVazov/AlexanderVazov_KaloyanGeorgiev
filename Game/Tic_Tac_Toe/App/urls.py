from django.urls import path
from . import views

urlpatterns = [
    path('tictactoe/', views.tictactoe),
    path('/', views.tictactoe),
]