from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os
import google.generativeai as genai
import io
load_dotenv()
app = Flask(__name__)
CORS(app)

groq_api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_api_key)
# Configure your Google Generative AI API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


expected_auth_message = "hello"

def clean_summary(summary):
    """Clean the summary text by removing special formatting characters and ensuring proper newlines."""
    # Remove unwanted characters like asterisks or bullet points
    cleaned_summary = summary.replace('*', '').replace('•', '').strip()
    
    # Ensure proper newlines
    return "\n".join(line.strip() for line in cleaned_summary.split('\n') if line.strip())

@app.route('/upload', methods=['POST'])
def upload_and_summarize():

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.lower().endswith('.pdf'):
        try:
            pdf_bytes = file.read()
            pdf_stream = io.BytesIO(pdf_bytes)

            sample_file = {
                "mime_type": "application/pdf",
                "data": pdf_stream.getvalue()
            }

        except Exception as e:
            app.logger.error(f"Error reading in-memory file: {e}")
            return jsonify({"error": f"Error reading file: {e}"}), 500

        model = genai.GenerativeModel(model_name="gemini-1.5-flash")

        try:
            response = model.generate_content([sample_file, "Summarize this document in plain text without any special formatting like bold or italic."])
            summary = response.text
            cleaned_summary = clean_summary(summary)
            return jsonify({"summary": cleaned_summary})
        except Exception as e:
            app.logger.error(f"Error generating summary: {e}")
            return jsonify({"error": f"Error generating summary: {e}"}), 500

    return jsonify({"error": "Invalid file format. Only PDFs are allowed."}), 400

def authenticate_request(provided_auth_message):
    """Authenticate the request by comparing the provided auth message with the expected one."""
    return provided_auth_message == expected_auth_message

def clean_response_text(text):

    cleaned_text = text.replace("*", "").replace("•", "")


    cleaned_text = "\n".join([line.strip() for line in cleaned_text.splitlines() if line.strip()])

    return cleaned_text

@app.route('/generate_response', methods=['POST'])
def generate_response():
    provided_auth_message = request.json.get('auth_message')
    user_message = request.json.get('message')
    chat_history = request.json.get('chat_history')


    if not provided_auth_message or not user_message:
        return jsonify({"error": "Authentication message or user message not provided"}), 400


    if not authenticate_request(provided_auth_message):
        return jsonify({"error": "Unauthorized access"}), 401


    if chat_history is None:
        chat_history = []


    system_message = {
        "role": "system",
        "content": (
            "You are articulateIQ chat assistant present onthe wbesite Your main goal is to handle the responses given by the site visitors so articulate IQ is an innovative web platform dedicated to empower neurodivers individuals by anxiety their communication and pronunciation skills through continuous personalized beach training neurodivers individuals including those with ADHD autism and different types of dyslexia server main feature of their website is there is a phoneme detection and phoneme detection tools it begins with the assessment of user pronunciation skills and detect different phonemes in which user is facing any struggle allowing user to focus on the training path of that particular phone by selecting the phone app for a given phoneme catalog there is also continuous and weekly training program that gives a holistic training approach and with a structured week by week training which gradually improve their pronunciation so my main ask is from you is when a user comes to the editing chat rod and chart with your ask you something you analyze the response and target or give them the different features of the website that align with their charts or the or their problem also there is a 3D articulation models in our website so user can see different models of the different sounds so that it would become easily for the user to see the visual demonstration of the phone that is produced also remedial guidelines is also given along with the groundbreaking feature of our conversational AI bought with helps us to give a conference post along with the pronunciation check it also gave report which helps to the guardians to analyze the different neurodiverse students so add in the conclusion suggest different features be friendly and be natural assistant for articulateIQ"
        )
    }


    messages = [system_message] + chat_history + [
        {
            "role": "user",
            "content": user_message
        }
    ]

    # Generate response using the Groq client
    completion = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=messages,
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )

    response_text = ""
    for chunk in completion:
        response_text += chunk.choices[0].delta.content or ""

    cleaned_response = clean_response_text(response_text)



    return jsonify({
        "response": cleaned_response
    })


@app.route('/')
def home():
    return 'Hi Buddy 🫡, I guess You have to see Documentation (Ask the owner).'


@app.route('/generate_response_with_context', methods=['POST'])
def generate_response_with_context():
    data = request.json


    provided_auth_message = data.get('auth_message')
    user_message = data.get('message')
    document_summary = data.get('document_summary')
    chat_history = data.get('chat_history')


    


    if not authenticate_request(provided_auth_message):
        return jsonify({"error": "Unauthorized access"}), 401


    messages = [
        {
            "role": "system",
                        "content": (
                            "You are articulateIQ chat assistant present onthe wbesite Your main goal is to handle the responses given by the site visitors so articulate IQ is an innovative web platform dedicated to empower neurodivers individuals by anxiety their communication and pronunciation skills through continuous personalized beach training neurodivers individuals including those with ADHD autism and different types of dyslexia server main feature of their website is there is a phoneme detection and phoneme detection tools it begins with the assessment of user pronunciation skills and detect different phonemes in which user is facing any struggle allowing user to focus on the training path of that particular phone by selecting the phone app for a given phoneme catalog there is also continuous and weekly training program that gives a holistic training approach and with a structured week by week training which gradually improve their pronunciation so my main ask is from you is when a user comes to the editing chat rod and chart with your ask you something you analyze the response and target or give them the different features of the website that align with their charts or the or their problem also there is a 3D articulation models in our website so user can see different models of the different sounds so that it would become easily for the user to see the visual demonstration of the phone that is produced also remedial guidelines is also given along with the groundbreaking feature of our conversational AI bought with helps us to give a conference post along with the pronunciation check it also gave report which helps to the guardians to analyze the different neurodiverse students so add in the conclusion suggest different features be friendly and be natural assistant for articulateIQ. In addition to this user would also be uploading any medical document or anything else related to their neurodiversity individual so I want to you to analyze it and analyze the summary and give them the features or any of the features present on our website or explain them the features of the website that align with their document summary"
                        )
        },
        {
            "role": "user",
            "content": "This is my medical document summary: " + document_summary
        }
    ]


    messages.extend(chat_history)


    messages.append({
        "role": "user",
        "content": user_message
    })


    completion = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=messages,
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )

    response_text = ""
    for chunk in completion:
        response_text += chunk.choices[0].delta.content or ""

    cleaned_response = clean_response_text(response_text)

    return jsonify({"response": cleaned_response})


if __name__ == '__main__':
    app.run(port=5000, debug=True)