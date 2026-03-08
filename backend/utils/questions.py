"""
Question Generator for MathMaster Pro
=====================================
Generates simple, clear math questions similar to MatematikMästaren.

Format: All questions use simple "X ? Y = ?" format where possible.
"""

import random
from typing import List, Dict, Any, Optional
import math


def generate_addition(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Addition: 5 + 3 = ?"""
    a = random.randint(min_val, max_val)
    b = random.randint(min_val, max_val)
    return {
        "type": "addition",
        "display": f"{a} + {b} = ?",
        "answer": a + b,
        "input_type": "number"
    }


def generate_subtraction(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Subtraction: 8 - 3 = ? (always positive result)"""
    a = random.randint(min_val, max_val)
    b = random.randint(min_val, max_val)
    if a < b:
        a, b = b, a
    return {
        "type": "subtraction",
        "display": f"{a} − {b} = ?",
        "answer": a - b,
        "input_type": "number"
    }


def generate_multiplication(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Multiplication: 6 × 7 = ?"""
    # Keep multiplication tables reasonable
    max_factor = min(12, max_val) if max_val > 10 else max_val
    a = random.randint(1, max(2, max_factor))
    b = random.randint(1, max(2, max_factor))
    return {
        "type": "multiplication",
        "display": f"{a} × {b} = ?",
        "answer": a * b,
        "input_type": "number"
    }


def generate_division(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Division: 24 ÷ 6 = ? (clean division)"""
    divisor = random.randint(2, min(12, max_val))
    quotient = random.randint(1, min(12, max_val))
    dividend = divisor * quotient
    return {
        "type": "division",
        "display": f"{dividend} ÷ {divisor} = ?",
        "answer": quotient,
        "input_type": "number"
    }


def generate_fractions(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Fractions - multiple types:
    1. Addition: 1/4 + 2/4 = ?
    2. Subtraction: 3/4 - 1/4 = ?
    3. Simplify: 4/8 = ?
    4. Compare: 1/2 ? 2/3
    5. Mixed to improper: 1 1/2 = ?/2
    """
    q_type = random.choice(['add', 'subtract', 'simplify', 'compare', 'multiply'])
    
    if q_type == 'add':
        # Same denominator addition
        denom = random.choice([2, 3, 4, 5, 6, 8, 10])
        n1 = random.randint(1, denom - 1)
        n2 = random.randint(1, denom - n1)
        result_num = n1 + n2
        # Simplify result
        gcd = math.gcd(result_num, denom)
        if result_num == denom:
            answer = "1"
        else:
            answer = f"{result_num // gcd}/{denom // gcd}"
        return {
            "type": "fractions",
            "display": f"{n1}/{denom} + {n2}/{denom} = ?",
            "answer": answer,
            "input_type": "fraction"
        }
    
    elif q_type == 'subtract':
        denom = random.choice([2, 3, 4, 5, 6, 8, 10])
        n1 = random.randint(2, denom)
        n2 = random.randint(1, n1 - 1)
        result_num = n1 - n2
        gcd = math.gcd(result_num, denom)
        answer = f"{result_num // gcd}/{denom // gcd}"
        return {
            "type": "fractions",
            "display": f"{n1}/{denom} − {n2}/{denom} = ?",
            "answer": answer,
            "input_type": "fraction"
        }
    
    elif q_type == 'simplify':
        # Create a fraction that can be simplified
        simple_num = random.randint(1, 5)
        simple_denom = random.randint(simple_num + 1, 8)
        gcd_orig = math.gcd(simple_num, simple_denom)
        simple_num //= gcd_orig
        simple_denom //= gcd_orig
        
        multiplier = random.randint(2, 4)
        big_num = simple_num * multiplier
        big_denom = simple_denom * multiplier
        
        texts = {
            "sv": "Förenkla:",
            "en": "Simplify:",
            "ar": "بسّط:",
            "fi": "Sievennä:",
            "es": "Simplifica:",
            "so": "Fududee:"
        }
        text = texts.get(lang, texts["sv"])
        
        return {
            "type": "fractions",
            "display": f"{text} {big_num}/{big_denom} = ?",
            "answer": f"{simple_num}/{simple_denom}",
            "input_type": "fraction"
        }
    
    elif q_type == 'compare':
        # Compare two fractions
        fracs = [
            (1, 2), (1, 3), (2, 3), (1, 4), (3, 4),
            (1, 5), (2, 5), (3, 5), (4, 5),
            (1, 6), (5, 6), (1, 8), (3, 8), (5, 8), (7, 8)
        ]
        f1, f2 = random.sample(fracs, 2)
        val1 = f1[0] / f1[1]
        val2 = f2[0] / f2[1]
        
        if val1 > val2:
            answer = ">"
        elif val1 < val2:
            answer = "<"
        else:
            answer = "="
        
        texts = {
            "sv": "Vilket är störst?",
            "en": "Which is greater?",
            "ar": "أيهما أكبر؟",
            "fi": "Kumpi on suurempi?",
            "es": "¿Cuál es mayor?",
            "so": "Kee ka weyn?"
        }
        text = texts.get(lang, texts["sv"])
        
        return {
            "type": "fractions",
            "display": f"{f1[0]}/{f1[1]} ? {f2[0]}/{f2[1]}",
            "answer": answer,
            "input_type": "choice",
            "options": ["<", "=", ">"],
            "hint": text
        }
    
    else:  # multiply
        # Simple fraction multiplication
        n1, d1 = random.randint(1, 3), random.randint(2, 5)
        n2, d2 = random.randint(1, 3), random.randint(2, 5)
        result_n = n1 * n2
        result_d = d1 * d2
        gcd = math.gcd(result_n, result_d)
        answer = f"{result_n // gcd}/{result_d // gcd}"
        
        return {
            "type": "fractions",
            "display": f"{n1}/{d1} × {n2}/{d2} = ?",
            "answer": answer,
            "input_type": "fraction"
        }


def generate_equations(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Equations - solve for x:
    - x + 5 = 12
    - x - 3 = 7
    - 3 × x = 15
    - x ÷ 4 = 3
    """
    eq_type = random.choice(['add', 'subtract', 'multiply', 'divide'])
    
    if eq_type == 'add':
        x = random.randint(1, max_val)
        a = random.randint(1, max_val)
        b = x + a
        return {
            "type": "equations",
            "display": f"x + {a} = {b}",
            "answer": x,
            "input_type": "number",
            "hint": "x = ?"
        }
    
    elif eq_type == 'subtract':
        x = random.randint(1, max_val)
        a = random.randint(1, x)
        b = x - a
        return {
            "type": "equations",
            "display": f"x − {a} = {b}",
            "answer": x,
            "input_type": "number",
            "hint": "x = ?"
        }
    
    elif eq_type == 'multiply':
        x = random.randint(1, min(10, max_val))
        a = random.randint(2, min(10, max_val))
        b = a * x
        return {
            "type": "equations",
            "display": f"{a} × x = {b}",
            "answer": x,
            "input_type": "number",
            "hint": "x = ?"
        }
    
    else:  # divide
        x = random.randint(2, min(12, max_val))
        a = random.randint(2, min(10, max_val))
        b = x * a
        return {
            "type": "equations",
            "display": f"x ÷ {a} = {x}",
            "answer": b,
            "input_type": "number",
            "hint": "x = ?"
        }


def generate_geometry(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Geometry - area and perimeter:
    - Rectangle area/perimeter
    - Triangle area
    - Square area/perimeter
    """
    texts = {
        "sv": {
            "rect_area": "Vad är arean på en rektangel med sidorna {w} och {h}?",
            "rect_perimeter": "Vad är omkretsen på en rektangel med sidorna {w} och {h}?",
            "square_area": "Vad är arean på en kvadrat med sidan {s}?",
            "square_perimeter": "Vad är omkretsen på en kvadrat med sidan {s}?",
            "triangle_area": "Vad är arean på en triangel med basen {b} och höjden {h}?",
        },
        "en": {
            "rect_area": "What is the area of a rectangle with sides {w} and {h}?",
            "rect_perimeter": "What is the perimeter of a rectangle with sides {w} and {h}?",
            "square_area": "What is the area of a square with side {s}?",
            "square_perimeter": "What is the perimeter of a square with side {s}?",
            "triangle_area": "What is the area of a triangle with base {b} and height {h}?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    shape = random.choice(['rect_area', 'rect_perimeter', 'square_area', 'square_perimeter', 'triangle_area'])
    
    if shape == 'rect_area':
        w = random.randint(2, min(15, max_val))
        h = random.randint(2, min(15, max_val))
        return {
            "type": "geometry",
            "display": t["rect_area"].format(w=w, h=h),
            "answer": w * h,
            "input_type": "number",
            "shape": "rectangle",
            "dimensions": {"width": w, "height": h}
        }
    
    elif shape == 'rect_perimeter':
        w = random.randint(2, min(15, max_val))
        h = random.randint(2, min(15, max_val))
        return {
            "type": "geometry",
            "display": t["rect_perimeter"].format(w=w, h=h),
            "answer": 2 * (w + h),
            "input_type": "number",
            "shape": "rectangle",
            "dimensions": {"width": w, "height": h}
        }
    
    elif shape == 'square_area':
        s = random.randint(2, min(12, max_val))
        return {
            "type": "geometry",
            "display": t["square_area"].format(s=s),
            "answer": s * s,
            "input_type": "number",
            "shape": "square",
            "dimensions": {"side": s}
        }
    
    elif shape == 'square_perimeter':
        s = random.randint(2, min(12, max_val))
        return {
            "type": "geometry",
            "display": t["square_perimeter"].format(s=s),
            "answer": 4 * s,
            "input_type": "number",
            "shape": "square",
            "dimensions": {"side": s}
        }
    
    else:  # triangle_area
        b = random.randint(2, min(12, max_val)) * 2  # Even base for clean division
        h = random.randint(2, min(12, max_val))
        return {
            "type": "geometry",
            "display": t["triangle_area"].format(b=b, h=h),
            "answer": (b * h) // 2,
            "input_type": "number",
            "shape": "triangle",
            "dimensions": {"base": b, "height": h}
        }


def generate_percentage(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Percentage:
    - What is 25% of 80?
    - 15 is what % of 60?
    """
    texts = {
        "sv": {
            "of": "Hur mycket är {p}% av {n}?",
            "find": "Hur många procent är {part} av {whole}?",
        },
        "en": {
            "of": "How much is {p}% of {n}?",
            "find": "What percentage is {part} of {whole}?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    q_type = random.choice(['of', 'find'])
    
    if q_type == 'of':
        percent = random.choice([10, 20, 25, 50, 75, 100, 5, 15, 30])
        # Make base divisible by factors for clean answers
        if percent in [25, 75]:
            base = random.choice([4, 8, 12, 16, 20, 40, 80, 100, 200]) * random.randint(1, 3)
        elif percent in [10, 20, 30, 50]:
            base = random.randint(2, 20) * 10
        else:
            base = random.randint(10, 100) * 10
        
        answer = int((percent / 100) * base)
        return {
            "type": "percentage",
            "display": t["of"].format(p=percent, n=base),
            "answer": answer,
            "input_type": "number"
        }
    
    else:  # find percentage
        whole = random.choice([20, 25, 40, 50, 80, 100, 200])
        percent = random.choice([10, 20, 25, 50, 75])
        part = int((percent / 100) * whole)
        return {
            "type": "percentage",
            "display": t["find"].format(part=part, whole=whole),
            "answer": percent,
            "input_type": "number"
        }


def generate_units(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Unit conversion with natural language questions
    """
    texts = {
        "sv": {
            "to_small": "Hur många {small} är {value} {big}?",
            "to_big": "Hur många {big} är {value} {small}?",
        },
        "en": {
            "to_small": "How many {small} is {value} {big}?",
            "to_big": "How many {big} is {value} {small}?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    conversions = [
        ("m", "cm", 100, "meter", "centimeter"),
        ("km", "m", 1000, "kilometer", "meter"),
        ("kg", "g", 1000, "kilogram", "gram"),
        ("l", "ml", 1000, "liter", "milliliter"),
        ("l", "dl", 10, "liter", "deciliter"),
        ("m", "mm", 1000, "meter", "millimeter"),
        ("h", "min", 60, "timmar", "minuter"),
        ("min", "sek", 60, "minuter", "sekunder"),
    ]
    
    conv = random.choice(conversions)
    big_unit, small_unit, factor, big_name, small_name = conv
    
    direction = random.choice(['to_small', 'to_big'])
    
    if direction == 'to_small':
        value = random.randint(1, min(10, max_val))
        answer = value * factor
        return {
            "type": "units",
            "display": t["to_small"].format(small=small_name, value=value, big=big_name),
            "answer": answer,
            "input_type": "number"
        }
    else:
        value = random.randint(1, min(10, max_val)) * factor
        answer = value // factor
        return {
            "type": "units",
            "display": t["to_big"].format(big=big_name, value=value, small=small_name),
            "answer": answer,
            "input_type": "number"
        }



def math_round(value: float, decimals: int = 0) -> float:
    """
    Standard mathematical rounding where .5 always rounds up.
    Python's round() uses banker's rounding (rounds .5 to nearest even).
    """
    multiplier = 10 ** decimals
    return math.floor(value * multiplier + 0.5) / multiplier


def generate_rounding(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Rounding with natural language questions
    Uses standard mathematical rounding (5 and above rounds up)
    """
    texts = {
        "sv": {
            "whole": "Vad blir {n} avrundat till heltal?",
            "tens": "Vad blir {n} avrundat till närmaste tiotal?",
            "decimal": "Vad blir {n} avrundat till en decimal?",
            "hundreds": "Vad blir {n} avrundat till närmaste hundratal?"
        },
        "en": {
            "whole": "What is {n} rounded to a whole number?",
            "tens": "What is {n} rounded to the nearest ten?",
            "decimal": "What is {n} rounded to one decimal?",
            "hundreds": "What is {n} rounded to the nearest hundred?"
        }
    }
    t = texts.get(lang, texts["sv"])
    
    round_type = random.choice(['whole', 'tens', 'decimal'])
    
    if round_type == 'whole':
        # Generate number with one decimal
        num = round(random.uniform(0.1, max_val) + random.random(), 1)
        answer = int(math_round(num, 0))
        return {
            "type": "rounding",
            "display": t["whole"].format(n=num),
            "answer": answer,
            "input_type": "number"
        }
    
    elif round_type == 'tens':
        num = random.randint(min_val, max_val * 10)
        # Round to nearest 10: divide by 10, round, multiply by 10
        answer = int(math_round(num / 10, 0) * 10)
        return {
            "type": "rounding",
            "display": t["tens"].format(n=num),
            "answer": answer,
            "input_type": "number"
        }
    
    else:  # decimal
        # Generate number with exactly two decimals (second decimal never 0)
        whole_part = random.randint(0, max_val)
        first_decimal = random.randint(0, 9)
        second_decimal = random.randint(1, 9)  # Never 0 to ensure 2 decimals
        num = whole_part + first_decimal / 10 + second_decimal / 100
        num = round(num, 2)
        answer = math_round(num, 1)
        return {
            "type": "rounding",
            "display": t["decimal"].format(n=num),
            "answer": answer,
            "input_type": "decimal"
        }


def generate_angles(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Angles:
    - Complement (90°): What + 30° = 90°?
    - Supplement (180°): What + 45° = 180°?
    - Triangle: 60° + 70° + ? = 180°
    """
    texts = {
        "sv": {
            "complement": "Vad är komplementvinkeln till {a}°?",
            "supplement": "Vad är supplementvinkeln till {a}°?",
            "triangle": "En triangel har två vinklar på {a}° och {b}°. Hur stor är den tredje vinkeln?"
        },
        "en": {
            "complement": "What is the complement of {a}°?",
            "supplement": "What is the supplement of {a}°?",
            "triangle": "A triangle has two angles of {a}° and {b}°. What is the third angle?"
        }
    }
    t = texts.get(lang, texts["sv"])
    
    angle_type = random.choice(['complement', 'supplement', 'triangle'])
    
    if angle_type == 'complement':
        angle = random.randint(10, 80)
        return {
            "type": "angles",
            "display": t["complement"].format(a=angle),
            "answer": 90 - angle,
            "input_type": "number"
        }
    
    elif angle_type == 'supplement':
        angle = random.randint(10, 170)
        return {
            "type": "angles",
            "display": t["supplement"].format(a=angle),
            "answer": 180 - angle,
            "input_type": "number"
        }
    
    else:  # triangle
        a = random.randint(30, 80)
        b = random.randint(30, 140 - a)
        c = 180 - a - b
        return {
            "type": "angles",
            "display": t["triangle"].format(a=a, b=b),
            "answer": c,
            "input_type": "number"
        }


def generate_probability(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Probability with natural language questions
    """
    texts = {
        "sv": {
            "dice": "Hur stor är sannolikheten att slå en {n}:a med en tärning? Svara som bråk.",
            "coin": "Hur stor är sannolikheten att få krona när man singlar slant? Svara som bråk.",
            "marble": "I en påse finns {r} röda och {b} blå kulor. Hur stor är sannolikheten att dra en röd? Svara som bråk."
        },
        "en": {
            "dice": "What is the probability of rolling a {n} with a dice? Answer as a fraction.",
            "coin": "What is the probability of getting heads when flipping a coin? Answer as a fraction.",
            "marble": "A bag contains {r} red and {b} blue marbles. What is the probability of drawing red? Answer as a fraction."
        }
    }
    t = texts.get(lang, texts["sv"])
    
    prob_type = random.choice(['dice', 'coin', 'marble'])
    
    if prob_type == 'dice':
        n = random.randint(1, 6)
        return {
            "type": "probability",
            "display": t["dice"].format(n=n),
            "answer": "1/6",
            "input_type": "fraction"
        }
    
    elif prob_type == 'coin':
        return {
            "type": "probability",
            "display": t["coin"],
            "answer": "1/2",
            "input_type": "fraction"
        }
    
    else:  # marble
        red = random.randint(1, 8)
        blue = random.randint(1, 8)
        total = red + blue
        gcd = math.gcd(red, total)
        return {
            "type": "probability",
            "display": t["marble"].format(r=red, b=blue),
            "answer": f"{red // gcd}/{total // gcd}",
            "input_type": "fraction"
        }


def generate_diagrams(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Diagrams - read data from bar charts:
    - Max value
    - Min value
    - Sum
    - Difference
    """
    texts = {
        "sv": {
            "days": ["Mån", "Tis", "Ons", "Tor", "Fre"],
            "max": "Högsta värde?",
            "min": "Lägsta värde?",
            "sum": "Summa av alla?",
            "diff": "Skillnad högst-lägst?"
        },
        "en": {
            "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
            "max": "Highest value?",
            "min": "Lowest value?",
            "sum": "Sum of all?",
            "diff": "Difference highest-lowest?"
        }
    }
    t = texts.get(lang, texts["sv"])
    
    days = t["days"]
    
    # Generate unique values for each bar
    # Ensure we have enough range for 5 unique values
    range_size = max_val - min_val + 1
    if range_size < 5:
        # Expand range if needed
        min_val = 1
        max_val = max(10, max_val)
    
    # Generate 5 unique random values
    available_values = list(range(min_val, max_val + 1))
    random.shuffle(available_values)
    values = available_values[:5]
    
    q_type = random.choice(['max', 'min', 'sum', 'diff'])
    
    # Create display string
    chart_data = " | ".join([f"{d}:{v}" for d, v in zip(days, values)])
    
    if q_type == 'max':
        answer = max(values)
        question = t["max"]
    elif q_type == 'min':
        answer = min(values)
        question = t["min"]
    elif q_type == 'sum':
        answer = sum(values)
        question = t["sum"]
    else:  # diff
        answer = max(values) - min(values)
        question = t["diff"]
    
    return {
        "type": "diagrams",
        "display": f"📊 {chart_data}\n{question}",
        "answer": answer,
        "input_type": "number",
        "chart_data": {"labels": days, "values": values}
    }


# Difficulty settings
DIFFICULTY_RANGES = {
    "easy": {"min": 1, "max": 10},
    "medium": {"min": 1, "max": 50},
    "hard": {"min": 1, "max": 100},
}

# Generator mapping
GENERATORS = {
    "addition": generate_addition,
    "subtraction": generate_subtraction,
    "multiplication": generate_multiplication,
    "division": generate_division,
    "fractions": generate_fractions,
    "equations": generate_equations,
    "geometry": generate_geometry,
    "percentage": generate_percentage,
    "units": generate_units,
    "rounding": generate_rounding,
    "angles": generate_angles,
    "probability": generate_probability,
    "diagrams": generate_diagrams,
}


def generate_questions(
    category: str = None,
    difficulty: str = "easy",
    count: int = 15,
    operations: List[str] = None,
    language: str = "sv"
) -> List[Dict[str, Any]]:
    """
    Generate questions for the game.
    
    Args:
        category: Single category (deprecated, use operations)
        difficulty: easy/medium/hard
        count: Number of questions
        operations: List of categories to mix
        language: Language code (sv, en, etc.)
    
    Returns:
        List of question dictionaries
    """
    range_cfg = DIFFICULTY_RANGES.get(difficulty, DIFFICULTY_RANGES["easy"])
    min_val = range_cfg["min"]
    max_val = range_cfg["max"]
    
    # Use operations list or fall back to category
    cats = operations if operations else ([category] if category else ["addition"])
    
    questions = []
    for i in range(count):
        cat = random.choice(cats)
        generator = GENERATORS.get(cat, generate_addition)
        
        q = generator(min_val, max_val, language)
        q["question_id"] = f"q_{random.randint(10000, 99999)}"
        q["operation"] = cat
        
        # Ensure answer is properly formatted
        if "answer" not in q:
            q["answer"] = 0
        
        # Convert answer to string for consistent handling
        q["correct_answer"] = str(q["answer"])
        
        questions.append(q)
    
    return questions
