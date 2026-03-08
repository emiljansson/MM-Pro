import random
from typing import List, Dict, Any, Optional
from fractions import Fraction
import math

# Question text translations
QUESTION_TEXTS = {
    # Fractions
    "simplify": {
        "sv": "Förenkla",
        "en": "Simplify",
        "ar": "بسّط",
        "fi": "Sievennä",
        "es": "Simplifica",
        "so": "Fududee"
    },
    # Percentage
    "what_is_percent_of": {
        "sv": "Vad är {percent}% av {base}?",
        "en": "What is {percent}% of {base}?",
        "ar": "ما هو {percent}% من {base}؟",
        "fi": "Mikä on {percent}% {base}:sta?",
        "es": "¿Cuánto es {percent}% de {base}?",
        "so": "Maxaa {percent}% ka mid ah {base}?"
    },
    "what_percent_is_of": {
        "sv": "Hur många procent är {part} av {base}?",
        "en": "What percent is {part} of {base}?",
        "ar": "ما هي النسبة المئوية لـ {part} من {base}؟",
        "fi": "Kuinka monta prosenttia {part} on {base}:sta?",
        "es": "¿Qué porcentaje es {part} de {base}?",
        "so": "Boqolkii intee ayuu {part} ka yahay {base}?"
    },
    # Rounding
    "round_to_integer": {
        "sv": "Avrunda {num} till heltal",
        "en": "Round {num} to whole number",
        "ar": "قرّب {num} إلى عدد صحيح",
        "fi": "Pyöristä {num} kokonaisluvuksi",
        "es": "Redondea {num} a número entero",
        "so": "Wareegi {num} ilaa tiro dhan"
    },
    "round_to_tens": {
        "sv": "Avrunda {num} till tiotal",
        "en": "Round {num} to tens",
        "ar": "قرّب {num} إلى العشرات",
        "fi": "Pyöristä {num} kymmeniin",
        "es": "Redondea {num} a decenas",
        "so": "Wareegi {num} ilaa tobanaan"
    },
    "round_to_one_decimal": {
        "sv": "Avrunda {num} till en decimal",
        "en": "Round {num} to one decimal",
        "ar": "قرّب {num} إلى منزلة عشرية واحدة",
        "fi": "Pyöristä {num} yhteen desimaaliin",
        "es": "Redondea {num} a un decimal",
        "so": "Wareegi {num} ilaa hal jajab"
    },
    # Geometry
    "rectangle_area": {
        "sv": "Rektangelns area: bredd {width}, höjd {height}",
        "en": "Rectangle area: width {width}, height {height}",
        "ar": "مساحة المستطيل: العرض {width}، الارتفاع {height}",
        "fi": "Suorakulmion pinta-ala: leveys {width}, korkeus {height}",
        "es": "Área del rectángulo: ancho {width}, alto {height}",
        "so": "Aagga leydi: ballac {width}, dherer {height}"
    },
    "rectangle_perimeter": {
        "sv": "Rektangelns omkrets: bredd {width}, höjd {height}",
        "en": "Rectangle perimeter: width {width}, height {height}",
        "ar": "محيط المستطيل: العرض {width}، الارتفاع {height}",
        "fi": "Suorakulmion ympärysmitta: leveys {width}, korkeus {height}",
        "es": "Perímetro del rectángulo: ancho {width}, alto {height}",
        "so": "Wareegga leydi: ballac {width}, dherer {height}"
    },
    "triangle_area": {
        "sv": "Triangelns area: bas {base}, höjd {height}",
        "en": "Triangle area: base {base}, height {height}",
        "ar": "مساحة المثلث: القاعدة {base}، الارتفاع {height}",
        "fi": "Kolmion pinta-ala: kanta {base}, korkeus {height}",
        "es": "Área del triángulo: base {base}, altura {height}",
        "so": "Aagga saddex-xagal: saldhig {base}, dherer {height}"
    },
    "circle_area": {
        "sv": "Cirkelns area (π≈3.14): radie {radius}",
        "en": "Circle area (π≈3.14): radius {radius}",
        "ar": "مساحة الدائرة (π≈3.14): نصف القطر {radius}",
        "fi": "Ympyrän pinta-ala (π≈3.14): säde {radius}",
        "es": "Área del círculo (π≈3.14): radio {radius}",
        "so": "Aagga goobada (π≈3.14): radius {radius}"
    },
    # Angles
    "complement_angle": {
        "sv": "Komplementvinkel till {angle}°",
        "en": "Complement angle to {angle}°",
        "ar": "الزاوية المكملة لـ {angle}°",
        "fi": "Komplementtikulma kulmalle {angle}°",
        "es": "Ángulo complementario de {angle}°",
        "so": "Xagalka dhammaystirka {angle}°"
    },
    "supplement_angle": {
        "sv": "Supplementvinkel till {angle}°",
        "en": "Supplement angle to {angle}°",
        "ar": "الزاوية المتممة لـ {angle}°",
        "fi": "Suplementtikulma kulmalle {angle}°",
        "es": "Ángulo suplementario de {angle}°",
        "so": "Xagalka kaabista {angle}°"
    },
    "triangle_third_angle": {
        "sv": "Triangelns tredje vinkel: {angle1}° och {angle2}°",
        "en": "Triangle's third angle: {angle1}° and {angle2}°",
        "ar": "الزاوية الثالثة للمثلث: {angle1}° و {angle2}°",
        "fi": "Kolmion kolmas kulma: {angle1}° ja {angle2}°",
        "es": "Tercer ángulo del triángulo: {angle1}° y {angle2}°",
        "so": "Xagalka saddexaad ee saddex-xagalka: {angle1}° iyo {angle2}°"
    },
    # Probability
    "dice_probability": {
        "sv": "Sannolikhet att slå {target} med en tärning?",
        "en": "Probability of rolling {target} with a die?",
        "ar": "احتمال الحصول على {target} برمي النرد؟",
        "fi": "Todennäköisyys saada {target} nopanheitolla?",
        "es": "¿Probabilidad de sacar {target} con un dado?",
        "so": "Suurtagalnimada inaad tuurtid {target} darbuuro?"
    },
    "marble_probability": {
        "sv": "{count} röda kulor av {total}. Sannolikhet för röd?",
        "en": "{count} red marbles out of {total}. Probability of red?",
        "ar": "{count} كرات حمراء من {total}. ما احتمال اختيار حمراء؟",
        "fi": "{count} punaista marmoria {total}:sta. Todennäköisyys punaiselle?",
        "es": "{count} canicas rojas de {total}. ¿Probabilidad de roja?",
        "so": "{count} kuul cas {total} ka mid ah. Suurtagalnimada cas?"
    },
    "coin_probability": {
        "sv": "Sannolikhet för krona vid myntkast?",
        "en": "Probability of heads when flipping a coin?",
        "ar": "احتمال الحصول على وجه عند رمي عملة؟",
        "fi": "Todennäköisyys kruunalle kolikonheitossa?",
        "es": "¿Probabilidad de cara al lanzar una moneda?",
        "so": "Suurtagalnimada madaxa marka lacagta la tuuro?"
    },
    # Diagrams
    "highest_value": {
        "sv": "Högsta värde?",
        "en": "Highest value?",
        "ar": "أعلى قيمة؟",
        "fi": "Korkein arvo?",
        "es": "¿Valor más alto?",
        "so": "Qiimaha ugu sareeya?"
    },
    "lowest_value": {
        "sv": "Lägsta värde?",
        "en": "Lowest value?",
        "ar": "أدنى قيمة؟",
        "fi": "Alin arvo?",
        "es": "¿Valor más bajo?",
        "so": "Qiimaha ugu hooseeya?"
    },
    "sum": {
        "sv": "Summa?",
        "en": "Sum?",
        "ar": "المجموع؟",
        "fi": "Summa?",
        "es": "¿Suma?",
        "so": "Wadarta?"
    },
    "difference_max_min": {
        "sv": "Skillnad max-min?",
        "en": "Difference max-min?",
        "ar": "الفرق بين الأعلى والأدنى؟",
        "fi": "Ero max-min?",
        "es": "¿Diferencia máx-mín?",
        "so": "Farqiga ugu badan-ugu yar?"
    },
    "bar_chart": {
        "sv": "Stapeldiagram",
        "en": "Bar chart",
        "ar": "مخطط شريطي",
        "fi": "Pylväsdiagrammi",
        "es": "Gráfico de barras",
        "so": "Jaantuska tiirarka"
    },
    # Days of week for diagrams
    "monday": {"sv": "Mån", "en": "Mon", "ar": "إثن", "fi": "Ma", "es": "Lun", "so": "Isn"},
    "tuesday": {"sv": "Tis", "en": "Tue", "ar": "ثلا", "fi": "Ti", "es": "Mar", "so": "Tal"},
    "wednesday": {"sv": "Ons", "en": "Wed", "ar": "أرب", "fi": "Ke", "es": "Mié", "so": "Arb"},
    "thursday": {"sv": "Tor", "en": "Thu", "ar": "خمي", "fi": "To", "es": "Jue", "so": "Kha"},
    "friday": {"sv": "Fre", "en": "Fri", "ar": "جمع", "fi": "Pe", "es": "Vie", "so": "Jim"},
}


def get_text(key: str, lang: str = "sv", **kwargs) -> str:
    """Get translated text with formatting"""
    texts = QUESTION_TEXTS.get(key, {})
    text = texts.get(lang, texts.get("sv", key))
    if kwargs:
        try:
            return text.format(**kwargs)
        except:
            return text
    return text


def generate_addition_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
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


def generate_subtraction_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
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


def generate_multiplication_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a multiplication question"""
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


def generate_division_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
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


def generate_fraction_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a fraction question"""
    question_types = ['add', 'subtract', 'simplify', 'compare']
    q_type = random.choice(question_types)
    
    if q_type == 'add':
        denom = random.randint(2, 10)
        num1 = random.randint(1, denom - 1)
        num2 = random.randint(1, denom - 1)
        answer_num = num1 + num2
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
        denom = random.randint(4, 12)
        multiplier = random.randint(2, 4)
        simple_num = random.randint(1, denom - 1)
        num = simple_num * multiplier
        denom_big = denom * multiplier
        gcd = math.gcd(num, denom_big)
        simplify_text = get_text("simplify", lang)
        return {
            "num1": f"{num}/{denom_big}",
            "num2": None,
            "operation": "fractions",
            "symbol": "=",
            "correct_answer": f"{num // gcd}/{denom_big // gcd}",
            "display": f"{simplify_text}: {num}/{denom_big} = ?",
            "answer_type": "fraction"
        }
    else:
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


def generate_percentage_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a percentage question"""
    question_types = ['of', 'find_percent']
    q_type = random.choice(question_types)
    
    if q_type == 'of':
        percent = random.choice([10, 20, 25, 50, 75, 100])
        base = random.randint(10, 100) * 10
        answer = (percent / 100) * base
        display = get_text("what_is_percent_of", lang, percent=percent, base=base)
        return {
            "num1": percent,
            "num2": base,
            "operation": "percentage",
            "symbol": "%",
            "correct_answer": int(answer),
            "display": display
        }
    else:
        base = random.randint(10, 100) * 10
        percent = random.choice([10, 20, 25, 50, 75])
        part = int((percent / 100) * base)
        display = get_text("what_percent_is_of", lang, part=part, base=base)
        return {
            "num1": part,
            "num2": base,
            "operation": "percentage",
            "symbol": "%",
            "correct_answer": percent,
            "display": display
        }


def generate_equation_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a simple equation question"""
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


def generate_rounding_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a rounding question"""
    num = random.randint(min_val * 10, max_val * 10) + random.random()
    round_to = random.choice(['ones', 'tens', 'tenths'])
    
    if round_to == 'ones':
        answer = round(num)
        display = get_text("round_to_integer", lang, num=f"{num:.1f}")
    elif round_to == 'tens':
        num = random.randint(min_val, max_val * 10)
        answer = round(num, -1)
        display = get_text("round_to_tens", lang, num=num)
    else:
        answer = round(num, 1)
        display = get_text("round_to_one_decimal", lang, num=f"{num:.2f}")
    
    return {
        "num1": num,
        "num2": round_to,
        "operation": "rounding",
        "symbol": "≈",
        "correct_answer": answer,
        "display": display
    }


def generate_geometry_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a geometry question"""
    shapes = ['rectangle_area', 'rectangle_perimeter', 'triangle_area', 'circle_area']
    shape = random.choice(shapes)
    
    if shape == 'rectangle_area':
        width = random.randint(2, min(15, max_val))
        height = random.randint(2, min(15, max_val))
        display = get_text("rectangle_area", lang, width=width, height=height)
        return {
            "num1": width,
            "num2": height,
            "operation": "geometry",
            "symbol": "□",
            "correct_answer": width * height,
            "display": display
        }
    elif shape == 'rectangle_perimeter':
        width = random.randint(2, min(15, max_val))
        height = random.randint(2, min(15, max_val))
        display = get_text("rectangle_perimeter", lang, width=width, height=height)
        return {
            "num1": width,
            "num2": height,
            "operation": "geometry",
            "symbol": "□",
            "correct_answer": 2 * (width + height),
            "display": display
        }
    elif shape == 'triangle_area':
        base = random.randint(2, min(12, max_val)) * 2
        height = random.randint(2, min(12, max_val))
        display = get_text("triangle_area", lang, base=base, height=height)
        return {
            "num1": base,
            "num2": height,
            "operation": "geometry",
            "symbol": "△",
            "correct_answer": (base * height) // 2,
            "display": display
        }
    else:
        radius = random.randint(1, min(10, max_val))
        display = get_text("circle_area", lang, radius=radius)
        return {
            "num1": radius,
            "num2": 3.14,
            "operation": "geometry",
            "symbol": "○",
            "correct_answer": round(3.14 * radius * radius),
            "display": display
        }


def generate_angles_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate an angles question"""
    question_types = ['complement', 'supplement', 'triangle']
    q_type = random.choice(question_types)
    
    if q_type == 'complement':
        angle = random.randint(10, 80)
        display = get_text("complement_angle", lang, angle=angle)
        return {
            "num1": angle,
            "num2": 90,
            "operation": "angles",
            "symbol": "∠",
            "correct_answer": 90 - angle,
            "display": display
        }
    elif q_type == 'supplement':
        angle = random.randint(10, 170)
        display = get_text("supplement_angle", lang, angle=angle)
        return {
            "num1": angle,
            "num2": 180,
            "operation": "angles",
            "symbol": "∠",
            "correct_answer": 180 - angle,
            "display": display
        }
    else:
        angle1 = random.randint(30, 80)
        angle2 = random.randint(30, 150 - angle1)
        display = get_text("triangle_third_angle", lang, angle1=angle1, angle2=angle2)
        return {
            "num1": angle1,
            "num2": angle2,
            "operation": "angles",
            "symbol": "△",
            "correct_answer": 180 - angle1 - angle2,
            "display": display
        }


def generate_probability_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a probability question"""
    q_type = random.choice(['dice', 'marbles', 'coins'])
    
    if q_type == 'dice':
        target = random.randint(1, 6)
        display = get_text("dice_probability", lang, target=target)
        return {
            "num1": target,
            "num2": 6,
            "operation": "probability",
            "symbol": "P",
            "correct_answer": "1/6",
            "display": display,
            "answer_type": "fraction"
        }
    elif q_type == 'marbles':
        total = random.randint(5, 15)
        target_count = random.randint(1, total - 1)
        gcd = math.gcd(target_count, total)
        display = get_text("marble_probability", lang, count=target_count, total=total)
        return {
            "num1": target_count,
            "num2": total,
            "operation": "probability",
            "symbol": "P",
            "correct_answer": f"{target_count // gcd}/{total // gcd}",
            "display": display,
            "answer_type": "fraction"
        }
    else:
        display = get_text("coin_probability", lang)
        return {
            "num1": 1,
            "num2": 2,
            "operation": "probability",
            "symbol": "P",
            "correct_answer": "1/2",
            "display": display,
            "answer_type": "fraction"
        }


def generate_units_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
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


def generate_diagram_question(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """Generate a diagram/chart reading question"""
    day_keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    categories = [get_text(key, lang) for key in day_keys]
    values = [random.randint(min_val, max_val) for _ in categories]
    
    q_type = random.choice(['max', 'min', 'sum', 'diff'])
    
    bar_chart = get_text("bar_chart", lang)
    chart_str = ', '.join([f'{c}:{v}' for c, v in zip(categories, values)])
    
    if q_type == 'max':
        answer = max(values)
        question = get_text("highest_value", lang)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"{bar_chart}: {chart_str}. {question}",
            "chart_data": {"labels": categories, "values": values}
        }
    elif q_type == 'min':
        answer = min(values)
        question = get_text("lowest_value", lang)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"{bar_chart}: {chart_str}. {question}",
            "chart_data": {"labels": categories, "values": values}
        }
    elif q_type == 'sum':
        answer = sum(values)
        question = get_text("sum", lang)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"{bar_chart}: {chart_str}. {question}",
            "chart_data": {"labels": categories, "values": values}
        }
    else:
        answer = max(values) - min(values)
        question = get_text("difference_max_min", lang)
        return {
            "num1": values,
            "num2": categories,
            "operation": "diagrams",
            "symbol": "📊",
            "correct_answer": answer,
            "display": f"{bar_chart}: {chart_str}. {question}",
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
    operations: Optional[List[str]] = None,
    language: str = "sv"
) -> List[Dict[str, Any]]:
    """Generate questions for a specific category and difficulty"""
    
    range_config = DIFFICULTY_RANGES.get(difficulty, DIFFICULTY_RANGES["easy"])
    min_val = range_config["min"]
    max_val = range_config["max"]
    
    questions = []
    
    if operations:
        for _ in range(count):
            op = random.choice(operations)
            generator = CATEGORY_GENERATORS.get(op, generate_addition_question)
            question = generator(min_val, max_val, language)
            question["question_id"] = f"q_{random.randint(10000, 99999)}"
            questions.append(question)
    else:
        generator = CATEGORY_GENERATORS.get(category, generate_addition_question)
        for _ in range(count):
            question = generator(min_val, max_val, language)
            question["question_id"] = f"q_{random.randint(10000, 99999)}"
            questions.append(question)
    
    return questions
