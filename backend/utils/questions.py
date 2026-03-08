import random
from typing import List, Dict, Any, Optional
from fractions import Fraction
import math


def generate_addition_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate an addition question"""
    num1 = random.randint(min_val, max_val)
    num2 = random.randint(min_val, max_val)
    return {
        "num1": num1,
        "num2": num2,
        "operation": "addition",
        "symbol": "+",
        "correct_answer": num1 + num2,
        "display": f"{num1} + {num2} = ?"
    }


def generate_subtraction_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a subtraction question (always positive result)"""
    num1 = random.randint(min_val, max_val)
    num2 = random.randint(min_val, max_val)
    if num1 < num2:
        num1, num2 = num2, num1
    return {
        "num1": num1,
        "num2": num2,
        "operation": "subtraction",
        "symbol": "−",
        "correct_answer": num1 - num2,
        "display": f"{num1} − {num2} = ?"
    }


def generate_multiplication_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a multiplication question"""
    # Limit to reasonable multiplication tables
    max_mult = min(12, max_val // 5) if max_val > 10 else max_val
    num1 = random.randint(1, max(2, max_mult))
    num2 = random.randint(1, max(2, max_mult))
    return {
        "num1": num1,
        "num2": num2,
        "operation": "multiplication",
        "symbol": "×",
        "correct_answer": num1 * num2,
        "display": f"{num1} × {num2} = ?"
    }


def generate_division_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a division question (clean division)"""
    divisor = random.randint(1, min(10, max_val))
    answer = random.randint(1, min(10, max_val))
    dividend = divisor * answer
    return {
        "num1": dividend,
        "num2": divisor,
        "operation": "division",
        "symbol": "÷",
        "correct_answer": answer,
        "display": f"{dividend} ÷ {divisor} = ?"
    }


def generate_fraction_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a fraction question"""
    question_types = ['add', 'subtract', 'simplify', 'compare']
    q_type = random.choice(question_types)
    
    if q_type == 'add':
        # Adding fractions with same denominator
        denom = random.randint(2, 10)
        num1 = random.randint(1, denom - 1)
        num2 = random.randint(1, denom - 1)
        answer_num = num1 + num2
        # Simplify
        gcd = math.gcd(answer_num, denom)
        return {
            "num1": f"{num1}/{denom}",
            "num2": f"{num2}/{denom}",
            "operation": "fractions",
            "symbol": "+",
            "correct_answer": f"{answer_num // gcd}/{denom // gcd}" if answer_num != denom else "1",
            "display": f"{num1}/{denom} + {num2}/{denom} = ?",
            "answer_type": "fraction"
        }
    elif q_type == 'simplify':
        # Simplify a fraction
        denom = random.randint(4, 12)
        multiplier = random.randint(2, 4)
        simple_num = random.randint(1, denom - 1)
        num = simple_num * multiplier
        denom_big = denom * multiplier
        gcd = math.gcd(num, denom_big)
        return {
            "num1": f"{num}/{denom_big}",
            "num2": None,
            "operation": "fractions",
            "symbol": "=",
            "correct_answer": f"{num // gcd}/{denom_big // gcd}",
            "display": f"Förenkla: {num}/{denom_big} = ?",
            "answer_type": "fraction"
        }
    else:
        # Compare fractions
        denom1 = random.randint(2, 8)
        denom2 = random.randint(2, 8)
        num1 = random.randint(1, denom1 - 1)
        num2 = random.randint(1, denom2 - 1)
        val1 = num1 / denom1
        val2 = num2 / denom2
        if val1 > val2:
            answer = ">"
        elif val1 < val2:
            answer = "<"
        else:
            answer = "="
        return {
            "num1": f"{num1}/{denom1}",
            "num2": f"{num2}/{denom2}",
            "operation": "fractions",
            "symbol": "?",
            "correct_answer": answer,
            "display": f"{num1}/{denom1} ? {num2}/{denom2}",
            "options": ["<", "=", ">"],
            "answer_type": "choice"
        }


def generate_percentage_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a percentage question"""
    question_types = ['of', 'find_percent', 'increase']
    q_type = random.choice(question_types)
    
    if q_type == 'of':
        # What is X% of Y?
        percent = random.choice([10, 20, 25, 50, 75, 100])
        base = random.randint(10, 100) * 10  # Nice round numbers
        answer = (percent / 100) * base
        return {
            "num1": percent,
            "num2": base,
            "operation": "percentage",
            "symbol": "%",
            "correct_answer": int(answer),
            "display": f"Vad är {percent}% av {base}?"
        }
    else:
        # What percent is X of Y?
        base = random.randint(10, 100) * 10
        percent = random.choice([10, 20, 25, 50, 75])
        part = int((percent / 100) * base)
        return {
            "num1": part,
            "num2": base,
            "operation": "percentage",
            "symbol": "%",
            "correct_answer": percent,
            "display": f"Hur många procent är {part} av {base}?"
        }


def generate_equation_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a simple equation question"""
    # x + a = b or a × x = b
    equation_type = random.choice(['add', 'mult'])
    
    if equation_type == 'add':
        x = random.randint(1, max_val)
        a = random.randint(1, max_val)
        b = x + a
        return {
            "num1": a,
            "num2": b,
            "operation": "equations",
            "symbol": "x",
            "correct_answer": x,
            "display": f"x + {a} = {b}, x = ?"
        }
    else:
        x = random.randint(1, min(10, max_val))
        a = random.randint(2, min(10, max_val))
        b = x * a
        return {
            "num1": a,
            "num2": b,
            "operation": "equations",
            "symbol": "x",
            "correct_answer": x,
            "display": f"{a} × x = {b}, x = ?"
        }


def generate_rounding_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a rounding question"""
    num = random.randint(min_val * 10, max_val * 10) + random.random()
    round_to = random.choice(['ones', 'tens', 'tenths'])
    
    if round_to == 'ones':
        answer = round(num)
        display = f"Avrunda {num:.1f} till heltal"
    elif round_to == 'tens':
        num = random.randint(min_val, max_val * 10)
        answer = round(num, -1)
        display = f"Avrunda {num} till tiotal"
    else:
        answer = round(num, 1)
        display = f"Avrunda {num:.2f} till en decimal"
    
    return {
        "num1": num,
        "num2": round_to,
        "operation": "rounding",
        "symbol": "≈",
        "correct_answer": answer,
        "display": display
    }


def generate_geometry_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a geometry question"""
    shapes = ['rectangle_area', 'rectangle_perimeter', 'triangle_area', 'circle_area']
    shape = random.choice(shapes)
    
    if shape == 'rectangle_area':
        width = random.randint(2, min(15, max_val))
        height = random.randint(2, min(15, max_val))
        return {
            "num1": width,
            "num2": height,
            "operation": "geometry",
            "symbol": "□",
            "correct_answer": width * height,
            "display": f"Rektangelns area: bredd {width}, höjd {height}"
        }
    elif shape == 'rectangle_perimeter':
        width = random.randint(2, min(15, max_val))
        height = random.randint(2, min(15, max_val))
        return {
            "num1": width,
            "num2": height,
            "operation": "geometry",
            "symbol": "□",
            "correct_answer": 2 * (width + height),
            "display": f"Rektangelns omkrets: bredd {width}, höjd {height}"
        }
    elif shape == 'triangle_area':
        base = random.randint(2, min(12, max_val)) * 2  # Even number for clean division
        height = random.randint(2, min(12, max_val))
        return {
            "num1": base,
            "num2": height,
            "operation": "geometry",
            "symbol": "△",
            "correct_answer": (base * height) // 2,
            "display": f"Triangelns area: bas {base}, höjd {height}"
        }
    else:  # circle
        radius = random.randint(1, min(10, max_val))
        # Approximate with pi = 3.14, round to integer
        return {
            "num1": radius,
            "num2": 3.14,
            "operation": "geometry",
            "symbol": "○",
            "correct_answer": round(3.14 * radius * radius),
            "display": f"Cirkelns area (π≈3.14): radie {radius}"
        }


def generate_angles_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate an angles question"""
    question_types = ['complement', 'supplement', 'triangle']
    q_type = random.choice(question_types)
    
    if q_type == 'complement':
        angle = random.randint(10, 80)
        return {
            "num1": angle,
            "num2": 90,
            "operation": "angles",
            "symbol": "∠",
            "correct_answer": 90 - angle,
            "display": f"Komplementvinkel till {angle}°"
        }
    elif q_type == 'supplement':
        angle = random.randint(10, 170)
        return {
            "num1": angle,
            "num2": 180,
            "operation": "angles",
            "symbol": "∠",
            "correct_answer": 180 - angle,
            "display": f"Supplementvinkel till {angle}°"
        }
    else:  # triangle
        angle1 = random.randint(30, 80)
        angle2 = random.randint(30, 150 - angle1)
        return {
            "num1": angle1,
            "num2": angle2,
            "operation": "angles",
            "symbol": "△",
            "correct_answer": 180 - angle1 - angle2,
            "display": f"Triangels tredje vinkel: {angle1}° och {angle2}°"
        }


def generate_probability_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a probability question"""
    # Dice, cards, or simple events
    q_type = random.choice(['dice', 'marbles', 'coins'])
    
    if q_type == 'dice':
        target = random.randint(1, 6)
        return {
            "num1": target,
            "num2": 6,
            "operation": "probability",
            "symbol": "P",
            "correct_answer": "1/6",
            "display": f"Sannolikhet att slå {target} med en tärning?",
            "answer_type": "fraction"
        }
    elif q_type == 'marbles':
        total = random.randint(5, 15)
        target_count = random.randint(1, total - 1)
        gcd = math.gcd(target_count, total)
        return {
            "num1": target_count,
            "num2": total,
            "operation": "probability",
            "symbol": "P",
            "correct_answer": f"{target_count // gcd}/{total // gcd}",
            "display": f"{target_count} röda kulor av {total}. Sannolikhet för röd?",
            "answer_type": "fraction"
        }
    else:  # coins
        return {
            "num1": 1,
            "num2": 2,
            "operation": "probability",
            "symbol": "P",
            "correct_answer": "1/2",
            "display": "Sannolikhet för krona vid myntkast?",
            "answer_type": "fraction"
        }


def generate_units_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a unit conversion question"""
    conversions = [
        ('m', 'cm', 100),
        ('km', 'm', 1000),
        ('kg', 'g', 1000),
        ('l', 'ml', 1000),
        ('m', 'mm', 1000),
        ('h', 'min', 60),
    ]
    
    conv = random.choice(conversions)
    from_unit, to_unit, factor = conv
    
    direction = random.choice(['to_small', 'to_big'])
    
    if direction == 'to_small':
        value = random.randint(1, min(10, max_val))
        answer = value * factor
        return {
            "num1": value,
            "num2": factor,
            "operation": "units",
            "symbol": "→",
            "correct_answer": answer,
            "display": f"{value} {from_unit} = ? {to_unit}"
        }
    else:
        value = random.randint(1, min(10, max_val)) * factor
        answer = value // factor
        return {
            "num1": value,
            "num2": factor,
            "operation": "units",
            "symbol": "→",
            "correct_answer": answer,
            "display": f"{value} {to_unit} = ? {from_unit}"
        }


def generate_diagram_question(min_val: int, max_val: int) -> Dict[str, Any]:
    """Generate a diagram/chart reading question"""
    # Simulate bar chart data
    categories = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre']
    values = [random.randint(min_val, max_val) for _ in categories]
    
    q_type = random.choice(['max', 'min', 'sum', 'diff'])
    
    if q_type == 'max':
        answer = max(values)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"Stapeldiagram: {', '.join([f'{c}:{v}' for c, v in zip(categories, values)])}. Högsta värde?",
            "chart_data": {"labels": categories, "values": values}
        }
    elif q_type == 'min':
        answer = min(values)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"Stapeldiagram: {', '.join([f'{c}:{v}' for c, v in zip(categories, values)])}. Lägsta värde?",
            "chart_data": {"labels": categories, "values": values}
        }
    elif q_type == 'sum':
        answer = sum(values)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"Stapeldiagram: {', '.join([f'{c}:{v}' for c, v in zip(categories, values)])}. Summa?",
            "chart_data": {"labels": categories, "values": values}
        }
    else:  # diff
        answer = max(values) - min(values)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"Stapeldiagram: {', '.join([f'{c}:{v}' for c, v in zip(categories, values)])}. Skillnad max-min?",
            "chart_data": {"labels": categories, "values": values}
        }


# Difficulty ranges
DIFFICULTY_RANGES = {
    "easy": {"min": 1, "max": 10},
    "medium": {"min": 10, "max": 50},
    "hard": {"min": 50, "max": 100},
    "expert": {"min": 100, "max": 500}
}

# Category to generator mapping
CATEGORY_GENERATORS = {
    "addition": generate_addition_question,
    "subtraction": generate_subtraction_question,
    "multiplication": generate_multiplication_question,
    "division": generate_division_question,
    "fractions": generate_fraction_question,
    "percentage": generate_percentage_question,
    "equations": generate_equation_question,
    "rounding": generate_rounding_question,
    "geometry": generate_geometry_question,
    "angles": generate_angles_question,
    "probability": generate_probability_question,
    "units": generate_units_question,
    "diagrams": generate_diagram_question,
}


def generate_questions(
    category: str,
    difficulty: str,
    count: int,
    operations: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Generate questions for a specific category and difficulty"""
    
    # Get difficulty range
    range_config = DIFFICULTY_RANGES.get(difficulty, DIFFICULTY_RANGES["easy"])
    min_val = range_config["min"]
    max_val = range_config["max"]
    
    questions = []
    
    # If operations provided (for backwards compatibility with mixed mode)
    if operations:
        for _ in range(count):
            op = random.choice(operations)
            generator = CATEGORY_GENERATORS.get(op, generate_addition_question)
            question = generator(min_val, max_val)
            question["question_id"] = f"q_{random.randint(10000, 99999)}"
            questions.append(question)
    else:
        generator = CATEGORY_GENERATORS.get(category, generate_addition_question)
        for _ in range(count):
            question = generator(min_val, max_val)
            question["question_id"] = f"q_{random.randint(10000, 99999)}"
            questions.append(question)
    
    return questions
