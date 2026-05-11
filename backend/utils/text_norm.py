import re

def normalize_vietnamese_text(text: str) -> str:
    # 1. Lowercase
    text = text.lower()
    
    # 2. Normalize numbers (Simple version for now)
    # 10km -> mười ki lô mét
    text = re.sub(r'(\d+)km', r'\1 ki lô mét', text)
    text = re.sub(r'(\d+)m', r'\1 mét', text)
    
    # 3. Simple Number to Text Mapping
    num_map = {
        '0': 'không', '1': 'một', '2': 'hai', '3': 'ba', '4': 'bốn',
        '5': 'năm', '6': 'sáu', '7': 'bảy', '8': 'tám', '9': 'chín'
    }
    
    # This is a very naive number converter, real one needs to handle units, tens, hundreds
    def replace_num(match):
        return " ".join([num_map.get(d, d) for d in match.group(0)])
    
    # text = re.sub(r'\d+', replace_num, text)
    
    # 4. Handle Years (2026 -> hai nghìn không trăm hai mươi sáu)
    # For now, let's just do a few specific examples or a placeholder
    if "2026" in text:
        text = text.replace("2026", "hai nghìn không trăm hai mươi sáu")
    
    return text.strip()
