import sys
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, redirect, session, send_from_directory
from flask_cors import CORS
from routes.auth import auth_bp
from routes.documents import document_bp
from routes.chat import chat_bp
from routes.dashboard import dashboard_bp
from database.connection import engine, Base

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
CONFIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config')

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR, static_url_path="/")

# Configuração de segurança e sessões
app.secret_key = os.environ.get("SECRET_KEY", os.urandom(24).hex())

# Configuração de cookies de sessão para produção (HTTPS)
app.config['SESSION_COOKIE_SECURE'] = os.environ.get("FLASK_ENV") == "production"
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hora

# CORS configurado para suportar credenciais (cookies de sessão)
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.register_blueprint(auth_bp)
app.register_blueprint(document_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")

def verificar_sessao():
    return "cnpj" in session

@app.route("/")
def index():
    if verificar_sessao():
        return redirect("/dashboard")
    return render_template("login.html")

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/dashboard")
def dashboard():
    if not verificar_sessao():
        return redirect("/")
    return render_template("dashboard.html")

@app.route("/chat")
def chat():
    if not verificar_sessao():
        return redirect("/")
    return render_template("chat.html")


@app.route("/config/screens.js")
def dashboard_screens_config():
    """Expõe a configuração das telas do dashboard como módulo ES."""
    return send_from_directory(CONFIG_DIR, "screens.js")

if __name__ == "__main__":
    # Cria diretórios necessários
    os.makedirs("src/temp", exist_ok=True)
    os.makedirs("src/database", exist_ok=True)
    
    # Inicializa o banco de dados
    Base.metadata.create_all(bind=engine)
    print("Banco de dados inicializado!")
    
    # Configuração para desenvolvimento vs produção
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    
    app.run(host="0.0.0.0", port=port, debug=debug)
