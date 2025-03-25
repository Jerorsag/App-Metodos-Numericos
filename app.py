# app.py
from flask import Flask

from app.controllers.api_controller import solve, explain_result, get_history_item
from app.controllers.view_controller import index_view, history_view
from config import config

# Crear la aplicación Flask
app = Flask(__name__, static_folder='static', template_folder='templates')

# Cargar configuración
app_config = config['development']
app.config.from_object(app_config)

# Rutas de vista
app.add_url_rule('/', view_func=index_view)
app.add_url_rule('/history', view_func=history_view)

# Rutas de API
app.add_url_rule('/api/solve', view_func=solve, methods=['POST'])
app.add_url_rule('/api/explain', view_func=explain_result, methods=['POST'])
app.add_url_rule('/api/history/<int:id>', view_func=get_history_item)

if __name__ == '__main__':
    app.run(debug=True)