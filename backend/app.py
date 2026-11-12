from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

from routes.health import bp as health_bp
from routes.processes import bp as processes_bp
from routes.events import bp as events_bp
from routes.analysis import bp as analysis_bp
from routes.quiz import bp as quiz_bp
from routes.ai import bp as ai_bp
import os
   

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(processes_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(ai_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG") == "1", host="127.0.0.1", port=5000)
