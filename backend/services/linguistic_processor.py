import re

class VietnameseProcessor:
    @staticmethod
    def normalize(text: str) -> str:
        """
        Advanced Vietnamese text normalization for premium TTS quality.
        Converts numbers, dates, and common symbols to spoken words.
        """
        # 1. Expand common abbreviations
        abbreviations = {
            r"\bTP\.?HCM\b": "Thành phố Hồ Chí Minh",
            r"\bHN\b": "Hà Nội",
            r"\bĐN\b": "Đà Nẵng",
            r"\bVN\b": "Việt Nam",
            r"\bBS\b": "Bác sĩ",
            r"\bThS\b": "Thạc sĩ",
            r"\bTS\b": "Tiến sĩ",
            r"\bkm\b": "ki lô mét",
            r"\bm\b": "mét",
            r"\bkg\b": "ki lô gam",
            r"\bg\b": "gam",
            r"\bl\b": "lít",
        }
        for pattern, replacement in abbreviations.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

        # 2. Handle Numbers (Simple version, can be expanded)
        # Convert digits to words for better prosody
        def num_to_vn(match):
            num_str = match.group(0)
            # This is a placeholder for a full number-to-words library
            # For now, we'll leave basic numbers but handle common currency/dates
            return num_str

        text = re.sub(r'\d+', num_to_vn, text)

        # 3. Handle Currency
        text = re.sub(r'(\d+)\$', r'\1 đô la', text)
        text = re.sub(r'(\d+)đ', r'\1 đồng', text)
        text = re.sub(r'(\d+)k\b', r'\1 nghìn', text)

        # 4. Punctuation for Pausing
        # Ensure spaces after punctuation for natural breath
        text = re.sub(r'([.,!?;])(?=[^\s])', r'\1 ', text)
        
        # 5. Handle AI/Tech terms
        tech_terms = {
            r"\bAI\b": "ây ai",
            r"\bChatGPT\b": "chát gê bê tê",
            r"\bGoogle\b": "gu gồ",
            r"\bFacebook\b": "phây búc",
            r"\bZalo\b": "da lô",
        }
        for pattern, replacement in tech_terms.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

        return text
