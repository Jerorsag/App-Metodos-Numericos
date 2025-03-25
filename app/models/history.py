# models/history.py
import uuid
from datetime import datetime

class HistoryManager:
    def __init__(self):
        self.history = []

    def add_calculation(self, method, func_str, parameters, root, results, plot_img, plot_data):
        calc_id = str(uuid.uuid4())
        history_item = {
            "id": len(self.history),
            "calc_id": calc_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "method": method,
            "function": func_str,
            "parameters": parameters,
            "root": root,
            "results": results,
            "plot_img": plot_img,
            "plot_data": plot_data
        }
        self.history.append(history_item)
        return calc_id

    def get_all(self):
        return self.history

    def get_by_id(self, id):
        if 0 <= id < len(self.history):
            return self.history[id]
        return None

    def get_by_calc_id(self, calc_id):
        return next((item for item in self.history if item.get('calc_id') == calc_id), None)