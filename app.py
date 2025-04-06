import re
import cloudscraper
import os
from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS

# Enable CORS for all routes
app = Flask(__name__)
CORS(app)

# Function to extract the deck ID from a Moxfield deck URL
def extract_deck_id(deck_url):
    match = re.search(r'/decks/([a-zA-Z0-9-_]+)', deck_url)
    if match:
        return match.group(1)
    else:
        return None

# Function to fetch deck data from Moxfield using the deck ID
def fetch_deck_data(deck_id):
    api_url = f"https://api2.moxfield.com/v3/decks/all/{deck_id}"
    scraper = cloudscraper.create_scraper()
    response = scraper.get(api_url)

    if response.status_code != 200:
        raise Exception(f"Failed to fetch deck {deck_id}: Status {response.status_code}")
    
    return response.json()

# Function to process deck and extract card names and quantities
def get_card_list(deck_data):
    cards = deck_data["boards"]["mainboard"]["cards"]
    card_list = {}
    for card_id, card_data in cards.items():
        card_name = card_data["card"].get("name", "Unknown Card")
        quantity = card_data.get("quantity", 1)
        card_list[card_name] = quantity
    return card_list

# Function to compare two decks and create a comparison result
def compare_decks(deck_a_cards, deck_b_cards):
    deck_a_unique = {card: qty for card, qty in deck_a_cards.items() if card not in deck_b_cards}
    deck_b_unique = {card: qty for card, qty in deck_b_cards.items() if card not in deck_a_cards}
    
    comparison_result = {
        'deck_a_unique': deck_a_unique,
        'deck_b_unique': deck_b_unique
    }

    return comparison_result

# Route to handle comparison
@app.route('/compare_decks', methods=['POST'])
def compare():
    data = request.json
    deck_a_url = data['deck_a_url']
    deck_b_url = data['deck_b_url']
    
    deck_a_id = extract_deck_id(deck_a_url)
    deck_b_id = extract_deck_id(deck_b_url)
    
    if not deck_a_id or not deck_b_id:
        return jsonify({"error": "Invalid deck URLs."}), 400

    try:
        # Fetch deck data
        data_a = fetch_deck_data(deck_a_id)
        data_b = fetch_deck_data(deck_b_id)
        
        deck_a_cards = get_card_list(data_a)
        deck_b_cards = get_card_list(data_b)
        
        # Compare decks and get result
        comparison_result = compare_decks(deck_a_cards, deck_b_cards)
        
        return jsonify(comparison_result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def hello_world():
    return 'Hello, World!'

# Run the Flask app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use the PORT env var, default to 5000 for local dev
    app.run(host='0.0.0.0', port=port)
