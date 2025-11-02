from flask import Blueprint, request, jsonify, session
from database.connection import SessionLocal
from models.usuario import Usuario
import requests
import bcrypt
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import limpar_cnpj, validar_cnpj

auth_bp = Blueprint("auth_bp", __name__)


def consultar_dados_cnpj(cnpj):
    """Consulta dados da empresa na API pública do CNPJ"""
    try:
        response = requests.get(f"https://publica.cnpj.ws/cnpj/{cnpj}", timeout=10)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Erro ao consultar CNPJ: {e}")
        return None


@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    cnpj = limpar_cnpj(data.get("cnpj", ""))
    senha = data.get("senha", "")

    if not validar_cnpj(cnpj):
        return jsonify({"erro": "CNPJ inválido"}), 400
    if not senha or len(senha) < 4:
        return jsonify({"erro": "Senha deve ter no mínimo 4 caracteres"}), 400

    db = SessionLocal()
    try:
        if db.query(Usuario).filter_by(cnpj=cnpj).first():
            return jsonify({"erro": "CNPJ já cadastrado"}), 409

        dados = consultar_dados_cnpj(cnpj)
        if not dados:
            return jsonify({"erro": "Erro ao consultar API de CNPJ"}), 500

        nome = dados.get("razao_social", "")
        natureza = dados.get("natureza_juridica", {}).get("descricao", "")
        situacao = dados.get("estabelecimento", {}).get("situacao_cadastral", "")
        simples = dados.get("simples", {})
        regime = "MEI" if simples.get("simples_nacional", {}).get("mei") else "Simples Nacional"

        senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        novo_usuario = Usuario(
            cnpj=cnpj,
            nome=nome,
            natureza_juridica=natureza,
            situacao_cadastral=situacao,
            regime_tributario=regime,
            senha=senha_hash
        )

        db.add(novo_usuario)
        db.commit()
        return jsonify({"mensagem": "Usuário cadastrado com sucesso!"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"erro": f"Erro no cadastro: {str(e)}"}), 500
    finally:
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    cnpj = limpar_cnpj(data.get("cnpj", ""))
    senha = data.get("senha", "")

    if not validar_cnpj(cnpj):
        return jsonify({"erro": "CNPJ inválido"}), 400

    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter_by(cnpj=cnpj).first()

        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        if not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha.encode("utf-8")):
            return jsonify({"erro": "Senha incorreta"}), 401

        # Marca a sessão como permanente e define o CNPJ
        session.permanent = True
        session["cnpj"] = usuario.cnpj
        
        return jsonify({
            "mensagem": "Login realizado com sucesso!",
            "usuario": {
                "nome": usuario.nome,
                "regime": usuario.regime_tributario,
                "natureza": usuario.natureza_juridica
            }
        }), 200
    finally:
        db.close()


@auth_bp.route("/api/usuario_dados", methods=["GET"])
def get_usuario_dados():
    if "cnpj" not in session:
        return jsonify({"erro": "Não autorizado"}), 401
    
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter_by(cnpj=session["cnpj"]).first()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        
        return jsonify({
            "nome": usuario.nome,
            "regime": usuario.regime_tributario,
            "natureza": usuario.natureza_juridica,
            "rbt12": float(usuario.rbt12) if usuario.rbt12 else 0.0
        }), 200
    finally:
        db.close()


@auth_bp.route("/api/atualizar_rbt12", methods=["POST"])
def atualizar_rbt12():
    if "cnpj" not in session:
        return jsonify({"erro": "Não autorizado"}), 401
    
    data = request.get_json()
    rbt12 = data.get("rbt12", 0.0)
    
    if rbt12 < 0:
        return jsonify({"erro": "RBT12 deve ser positivo"}), 400
    
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter_by(cnpj=session["cnpj"]).first()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        
        usuario.rbt12 = float(rbt12)
        db.commit()
        return jsonify({"mensagem": "RBT12 atualizado com sucesso!", "rbt12": rbt12}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        db.close()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"mensagem": "Logout efetuado com sucesso"}), 200
