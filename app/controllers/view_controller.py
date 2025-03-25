# controllers/view_controller.py
from flask import render_template

from app.models.history import HistoryManager

# Crear una única instancia de HistoryManager para compartir entre controladores
history_manager = HistoryManager()

def index_view():
    """Renderiza la página principal"""
    return render_template('index.html')

def history_view():
    """Renderiza la página de historial"""
    return render_template('history.html', history=history_manager.get_all())
