"""
Server Messages Handler
Polls server for messages and displays them to user.
"""

import requests
import logging
from typing import List, Dict
import tkinter as tk
from tkinter import messagebox

logger = logging.getLogger("ITMonitorAgent")


def check_server_messages(server_url: str, api_key: str) -> List[Dict]:
    """
    Check for pending messages from server.
    Returns list of messages.
    """
    try:
        headers = {"x-api-key": api_key}
        
        # Get messages (server resolves computerId from API key)
        response = requests.get(
            f"{server_url}/api/server-messages",
            headers=headers,
            timeout=10,
        )
        
        if response.status_code == 200:
            messages = response.json()
            return messages
        else:
            logger.debug(f"No messages from server: {response.status_code}")
            return []
            
    except Exception as e:
        logger.debug(f"Error checking server messages: {e}")
        return []


def mark_message_delivered(server_url: str, api_key: str, message_id: str) -> bool:
    """Mark a message as delivered."""
    try:
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
        }
        
        response = requests.patch(
            f"{server_url}/api/server-messages/{message_id}",
            headers=headers,
            json={"delivered": True},
            timeout=10,
        )
        
        return response.status_code == 200
        
    except Exception as e:
        logger.error(f"Error marking message delivered: {e}")
        return False


def show_message_popup(message: str, title: str = "ຂໍ້ຄວາມຈາກ IT"):
    """
    Show message popup to user.
    Uses Lao language for title.
    """
    try:
        root = tk.Tk()
        root.withdraw()  # Hide main window
        root.attributes('-topmost', True)  # Bring to front
        
        messagebox.showinfo(title, message, parent=root)
        
        root.destroy()
        
    except Exception as e:
        logger.error(f"Error showing message popup: {e}")


def process_server_messages(server_url: str, api_key: str):
    """
    Check for and process server messages.
    Shows popup for each message and marks as delivered.
    """
    messages = check_server_messages(server_url, api_key)
    
    for msg in messages:
        message_id = msg.get("id")
        message_text = msg.get("message", "")
        
        if message_text:
            logger.info(f"Received server message: {message_text[:50]}...")
            show_message_popup(message_text)
            
            # Mark as delivered
            if message_id:
                if mark_message_delivered(server_url, api_key, message_id):
                    logger.info(f"Message {message_id} marked as delivered")
                else:
                    logger.warning(f"Failed to mark message {message_id} as delivered")
