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
    """
    Addition with difficulty scaling:
    Easy: Small numbers (1-10)
    Medium: Larger numbers (10-100), some decimals
    Hard: Very large numbers, decimals, negatives
    """
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        return {
            "type": "addition",
            "display": f"{a} + {b} = ?",
            "answer": a + b,
            "input_type": "number"
        }
    
    elif is_medium:
        q_type = random.choice(['large', 'decimal', 'three_numbers'])
        
        if q_type == 'large':
            a = random.randint(10, 100)
            b = random.randint(10, 100)
            return {
                "type": "addition",
                "display": f"{a} + {b} = ?",
                "answer": a + b,
                "input_type": "number"
            }
        
        elif q_type == 'decimal':
            a = round(random.uniform(1, 20), 1)
            b = round(random.uniform(1, 20), 1)
            answer = round(a + b, 1)
            return {
                "type": "addition",
                "display": f"{a} + {b} = ?",
                "answer": answer,
                "input_type": "decimal"
            }
        
        else:  # three_numbers
            a = random.randint(5, 30)
            b = random.randint(5, 30)
            c = random.randint(5, 30)
            return {
                "type": "addition",
                "display": f"{a} + {b} + {c} = ?",
                "answer": a + b + c,
                "input_type": "number"
            }
    
    else:  # is_hard
        q_type = random.choice(['very_large', 'decimals', 'negative', 'four_numbers'])
        
        if q_type == 'very_large':
            a = random.randint(100, 500)
            b = random.randint(100, 500)
            return {
                "type": "addition",
                "display": f"{a} + {b} = ?",
                "answer": a + b,
                "input_type": "number"
            }
        
        elif q_type == 'decimals':
            a = round(random.uniform(10, 100), 1)
            b = round(random.uniform(10, 100), 1)
            answer = round(a + b, 1)
            return {
                "type": "addition",
                "display": f"{a} + {b} = ?",
                "answer": answer,
                "input_type": "decimal"
            }
        
        elif q_type == 'negative':
            a = random.randint(10, 50)
            b = -random.randint(1, a - 1)  # Negative but result is positive
            return {
                "type": "addition",
                "display": f"{a} + ({b}) = ?",
                "answer": a + b,
                "input_type": "number"
            }
        
        else:  # four_numbers
            a = random.randint(10, 50)
            b = random.randint(10, 50)
            c = random.randint(10, 50)
            d = random.randint(10, 50)
            return {
                "type": "addition",
                "display": f"{a} + {b} + {c} + {d} = ?",
                "answer": a + b + c + d,
                "input_type": "number"
            }


def generate_subtraction(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Subtraction with difficulty scaling:
    Easy: Small numbers, always positive result
    Medium: Larger numbers, some negative results
    Hard: Very large numbers, decimals, multiple subtractions
    """
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        a = random.randint(2, 10)
        b = random.randint(1, a - 1)  # Always positive result
        return {
            "type": "subtraction",
            "display": f"{a} − {b} = ?",
            "answer": a - b,
            "input_type": "number"
        }
    
    elif is_medium:
        q_type = random.choice(['large', 'decimal', 'chain'])
        
        if q_type == 'large':
            a = random.randint(50, 100)
            b = random.randint(10, a - 1)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} = ?",
                "answer": a - b,
                "input_type": "number"
            }
        
        elif q_type == 'decimal':
            a = round(random.uniform(10, 30), 1)
            b = round(random.uniform(1, float(a) - 0.1), 1)
            answer = round(a - b, 1)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} = ?",
                "answer": answer,
                "input_type": "decimal"
            }
        
        else:  # chain (a - b - c)
            a = random.randint(30, 60)
            b = random.randint(5, 15)
            c = random.randint(5, 15)
            while a - b - c < 0:
                b = random.randint(5, 10)
                c = random.randint(5, 10)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} − {c} = ?",
                "answer": a - b - c,
                "input_type": "number"
            }
    
    else:  # is_hard
        q_type = random.choice(['very_large', 'decimals', 'negative_result', 'complex'])
        
        if q_type == 'very_large':
            a = random.randint(200, 500)
            b = random.randint(50, 200)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} = ?",
                "answer": a - b,
                "input_type": "number"
            }
        
        elif q_type == 'decimals':
            a = round(random.uniform(50, 150), 1)
            b = round(random.uniform(10, 100), 1)
            while b >= a:
                b = round(random.uniform(10, float(a) - 0.1), 1)
            answer = round(a - b, 1)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} = ?",
                "answer": answer,
                "input_type": "decimal"
            }
        
        elif q_type == 'negative_result':
            a = random.randint(10, 30)
            b = random.randint(a + 1, a + 20)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} = ?",
                "answer": a - b,
                "input_type": "number"
            }
        
        else:  # complex (multiple operations)
            a = random.randint(100, 200)
            b = random.randint(20, 50)
            c = random.randint(20, 50)
            d = random.randint(10, 30)
            return {
                "type": "subtraction",
                "display": f"{a} − {b} − {c} − {d} = ?",
                "answer": a - b - c - d,
                "input_type": "number"
            }


def generate_multiplication(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Multiplication with difficulty scaling:
    Easy: Basic times tables (1-10)
    Medium: Extended tables, two-digit × one-digit
    Hard: Two-digit × two-digit, decimals
    """
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        return {
            "type": "multiplication",
            "display": f"{a} × {b} = ?",
            "answer": a * b,
            "input_type": "number"
        }
    
    elif is_medium:
        q_type = random.choice(['extended', 'two_by_one', 'squares'])
        
        if q_type == 'extended':
            a = random.randint(2, 12)
            b = random.randint(11, 15)
            return {
                "type": "multiplication",
                "display": f"{a} × {b} = ?",
                "answer": a * b,
                "input_type": "number"
            }
        
        elif q_type == 'two_by_one':
            a = random.randint(10, 30)
            b = random.randint(2, 9)
            return {
                "type": "multiplication",
                "display": f"{a} × {b} = ?",
                "answer": a * b,
                "input_type": "number"
            }
        
        else:  # squares
            a = random.randint(5, 15)
            return {
                "type": "multiplication",
                "display": f"{a} × {a} = ?",
                "answer": a * a,
                "input_type": "number"
            }
    
    else:  # is_hard
        q_type = random.choice(['two_by_two', 'large', 'decimals'])
        
        if q_type == 'two_by_two':
            a = random.randint(11, 25)
            b = random.randint(11, 25)
            return {
                "type": "multiplication",
                "display": f"{a} × {b} = ?",
                "answer": a * b,
                "input_type": "number"
            }
        
        elif q_type == 'large':
            a = random.randint(20, 50)
            b = random.randint(5, 12)
            return {
                "type": "multiplication",
                "display": f"{a} × {b} = ?",
                "answer": a * b,
                "input_type": "number"
            }
        
        else:  # decimals
            a = round(random.uniform(1, 10), 1)
            b = random.randint(2, 10)
            answer = round(a * b, 1)
            return {
                "type": "multiplication",
                "display": f"{a} × {b} = ?",
                "answer": answer,
                "input_type": "decimal"
            }


def generate_division(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Division with difficulty scaling:
    Easy: Basic division (clean results 1-10)
    Medium: Larger dividends, some remainders
    Hard: Large numbers, decimal results
    """
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        divisor = random.randint(2, 10)
        quotient = random.randint(1, 10)
        dividend = divisor * quotient
        return {
            "type": "division",
            "display": f"{dividend} ÷ {divisor} = ?",
            "answer": quotient,
            "input_type": "number"
        }
    
    elif is_medium:
        q_type = random.choice(['clean', 'larger'])
        
        if q_type == 'clean':
            divisor = random.randint(3, 12)
            quotient = random.randint(5, 15)
            dividend = divisor * quotient
            return {
                "type": "division",
                "display": f"{dividend} ÷ {divisor} = ?",
                "answer": quotient,
                "input_type": "number"
            }
        
        else:  # larger
            divisor = random.randint(5, 15)
            quotient = random.randint(10, 25)
            dividend = divisor * quotient
            return {
                "type": "division",
                "display": f"{dividend} ÷ {divisor} = ?",
                "answer": quotient,
                "input_type": "number"
            }
    
    else:  # is_hard
        q_type = random.choice(['large', 'decimal_result', 'chain'])
        
        if q_type == 'large':
            divisor = random.randint(10, 25)
            quotient = random.randint(15, 40)
            dividend = divisor * quotient
            return {
                "type": "division",
                "display": f"{dividend} ÷ {divisor} = ?",
                "answer": quotient,
                "input_type": "number"
            }
        
        elif q_type == 'decimal_result':
            # Division that gives .5 result
            divisor = random.randint(2, 10)
            quotient_base = random.randint(5, 15)
            # Make dividend such that result is X.5
            dividend = divisor * quotient_base + divisor // 2
            answer = dividend / divisor
            return {
                "type": "division",
                "display": f"{dividend} ÷ {divisor} = ?",
                "answer": answer,
                "input_type": "decimal"
            }
        
        else:  # chain division
            a = random.randint(100, 200)
            b = random.randint(2, 5)
            c = random.randint(2, 5)
            # Ensure clean division
            a = a - (a % (b * c))
            if a == 0:
                a = b * c * random.randint(5, 15)
            return {
                "type": "division",
                "display": f"{a} ÷ {b} ÷ {c} = ?",
                "answer": a // b // c,
                "input_type": "number"
            }


def generate_fractions(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Fractions - difficulty based:
    
    Easy (max_val <= 10):
      - Same denominator: 1/4 + 2/4 = ?
      - Simple simplify: 4/8 = ?
      - Compare simple fractions
    
    Medium (max_val 11-50):
      - Different denominators: 1/3 + 1/4 = ?
      - Larger numbers, simplify required
      - More complex comparisons
    
    Hard (max_val > 50):
      - Mixed numbers: 1½ + 2¼ = ?
      - Multiplication: 2/3 × 3/4 = ?
      - Division: 5/6 ÷ 2/3 = ?
    """
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        q_type = random.choice(['add_same', 'subtract_same', 'simplify', 'compare'])
        
        if q_type == 'add_same':
            # Same denominator addition
            denom = random.choice([2, 3, 4, 5, 6, 8])
            n1 = random.randint(1, denom - 1)
            n2 = random.randint(1, denom - n1)
            result_num = n1 + n2
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
        
        elif q_type == 'subtract_same':
            denom = random.choice([2, 3, 4, 5, 6, 8])
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
            simple_num = random.randint(1, 4)
            simple_denom = random.randint(simple_num + 1, 6)
            gcd_orig = math.gcd(simple_num, simple_denom)
            simple_num //= gcd_orig
            simple_denom //= gcd_orig
            
            multiplier = random.randint(2, 3)
            big_num = simple_num * multiplier
            big_denom = simple_denom * multiplier
            
            texts = {"sv": "Förenkla:", "en": "Simplify:", "ar": "بسّط:", "fi": "Sievennä:", "es": "Simplifica:", "so": "Fududee:"}
            text = texts.get(lang, texts["sv"])
            
            return {
                "type": "fractions",
                "display": f"{text} {big_num}/{big_denom} = ?",
                "answer": f"{simple_num}/{simple_denom}",
                "input_type": "fraction"
            }
        
        else:  # compare
            fracs = [(1, 2), (1, 3), (2, 3), (1, 4), (3, 4), (1, 5), (2, 5)]
            f1, f2 = random.sample(fracs, 2)
            val1 = f1[0] / f1[1]
            val2 = f2[0] / f2[1]
            
            if val1 > val2:
                answer = ">"
            elif val1 < val2:
                answer = "<"
            else:
                answer = "="
            
            texts = {"sv": "Vilket är störst?", "en": "Which is greater?", "ar": "أيهما أكبر؟", "fi": "Kumpi on suurempi?", "es": "¿Cuál es mayor?", "so": "Kee ka weyn?"}
            text = texts.get(lang, texts["sv"])
            
            return {
                "type": "fractions",
                "display": f"{f1[0]}/{f1[1]} ? {f2[0]}/{f2[1]}",
                "answer": answer,
                "input_type": "choice",
                "options": ["<", "=", ">"],
                "hint": text
            }
    
    elif is_medium:
        q_type = random.choice(['add_diff', 'subtract_diff', 'simplify', 'compare', 'multiply'])
        
        if q_type == 'add_diff':
            # Different denominators: 1/3 + 1/4 = 7/12
            denoms = [(2, 3), (2, 4), (3, 4), (2, 6), (3, 6), (4, 6), (2, 8), (4, 8), (3, 9)]
            d1, d2 = random.choice(denoms)
            n1 = random.randint(1, d1 - 1)
            n2 = random.randint(1, d2 - 1)
            
            # Calculate common denominator
            lcd = (d1 * d2) // math.gcd(d1, d2)
            result_num = n1 * (lcd // d1) + n2 * (lcd // d2)
            gcd = math.gcd(result_num, lcd)
            
            if result_num >= lcd:
                whole = result_num // lcd
                remainder = result_num % lcd
                if remainder == 0:
                    answer = str(whole)
                else:
                    gcd2 = math.gcd(remainder, lcd)
                    answer = f"{whole} {remainder // gcd2}/{lcd // gcd2}"
            else:
                answer = f"{result_num // gcd}/{lcd // gcd}"
            
            return {
                "type": "fractions",
                "display": f"{n1}/{d1} + {n2}/{d2} = ?",
                "answer": answer,
                "input_type": "fraction"
            }
        
        elif q_type == 'subtract_diff':
            # Different denominators subtraction
            denoms = [(3, 2), (4, 2), (4, 3), (6, 2), (6, 3), (6, 4), (8, 2), (8, 4)]
            d1, d2 = random.choice(denoms)
            n1 = random.randint(2, d1 - 1)
            n2 = random.randint(1, min(d2 - 1, n1 - 1))
            
            lcd = (d1 * d2) // math.gcd(d1, d2)
            result_num = n1 * (lcd // d1) - n2 * (lcd // d2)
            
            if result_num <= 0:
                n1, n2 = d1 - 1, 1
                result_num = n1 * (lcd // d1) - n2 * (lcd // d2)
            
            gcd = math.gcd(result_num, lcd)
            answer = f"{result_num // gcd}/{lcd // gcd}"
            
            return {
                "type": "fractions",
                "display": f"{n1}/{d1} − {n2}/{d2} = ?",
                "answer": answer,
                "input_type": "fraction"
            }
        
        elif q_type == 'simplify':
            simple_num = random.randint(1, 6)
            simple_denom = random.randint(simple_num + 1, 10)
            gcd_orig = math.gcd(simple_num, simple_denom)
            simple_num //= gcd_orig
            simple_denom //= gcd_orig
            
            multiplier = random.randint(3, 5)
            big_num = simple_num * multiplier
            big_denom = simple_denom * multiplier
            
            texts = {"sv": "Förenkla:", "en": "Simplify:", "ar": "بسّط:", "fi": "Sievennä:", "es": "Simplifica:", "so": "Fududee:"}
            text = texts.get(lang, texts["sv"])
            
            return {
                "type": "fractions",
                "display": f"{text} {big_num}/{big_denom} = ?",
                "answer": f"{simple_num}/{simple_denom}",
                "input_type": "fraction"
            }
        
        elif q_type == 'compare':
            fracs = [(1, 2), (1, 3), (2, 3), (1, 4), (3, 4), (2, 5), (3, 5), (4, 5), (1, 6), (5, 6), (3, 8), (5, 8), (7, 8)]
            f1, f2 = random.sample(fracs, 2)
            val1 = f1[0] / f1[1]
            val2 = f2[0] / f2[1]
            
            if val1 > val2:
                answer = ">"
            elif val1 < val2:
                answer = "<"
            else:
                answer = "="
            
            texts = {"sv": "Vilket är störst?", "en": "Which is greater?", "ar": "أيهما أكبر؟", "fi": "Kumpi on suurempi?", "es": "¿Cuál es mayor?", "so": "Kee ka weyn?"}
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
            n1, d1 = random.randint(1, 4), random.randint(2, 6)
            n2, d2 = random.randint(1, 4), random.randint(2, 6)
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
    
    else:  # is_hard
        q_type = random.choice(['mixed_add', 'mixed_subtract', 'multiply', 'divide'])
        
        if q_type == 'mixed_add':
            # Mixed numbers: 1½ + 2¼ = 3¾
            w1 = random.randint(1, 3)
            n1, d1 = random.randint(1, 3), random.choice([2, 4])
            w2 = random.randint(1, 3)
            n2, d2 = random.randint(1, 3), random.choice([2, 4])
            
            # Convert to improper fractions
            imp1 = w1 * d1 + n1
            imp2 = w2 * d2 + n2
            
            lcd = (d1 * d2) // math.gcd(d1, d2)
            result_num = imp1 * (lcd // d1) + imp2 * (lcd // d2)
            
            whole = result_num // lcd
            remainder = result_num % lcd
            
            if remainder == 0:
                answer = str(whole)
            else:
                gcd = math.gcd(remainder, lcd)
                answer = f"{whole} {remainder // gcd}/{lcd // gcd}"
            
            return {
                "type": "fractions",
                "display": f"{w1} {n1}/{d1} + {w2} {n2}/{d2} = ?",
                "answer": answer,
                "input_type": "fraction"
            }
        
        elif q_type == 'mixed_subtract':
            # Mixed subtraction: 3½ - 1¼ = 2¼
            w1 = random.randint(2, 4)
            n1, d1 = random.randint(1, 3), random.choice([2, 4])
            w2 = random.randint(1, w1 - 1)
            n2, d2 = random.randint(1, 3), random.choice([2, 4])
            
            imp1 = w1 * d1 + n1
            imp2 = w2 * d2 + n2
            
            lcd = (d1 * d2) // math.gcd(d1, d2)
            result_num = imp1 * (lcd // d1) - imp2 * (lcd // d2)
            
            if result_num <= 0:
                w1, n1, w2, n2 = 3, 3, 1, 1
                imp1 = w1 * d1 + n1
                imp2 = w2 * d2 + n2
                result_num = imp1 * (lcd // d1) - imp2 * (lcd // d2)
            
            whole = result_num // lcd
            remainder = result_num % lcd
            
            if remainder == 0:
                answer = str(whole)
            elif whole == 0:
                gcd = math.gcd(remainder, lcd)
                answer = f"{remainder // gcd}/{lcd // gcd}"
            else:
                gcd = math.gcd(remainder, lcd)
                answer = f"{whole} {remainder // gcd}/{lcd // gcd}"
            
            return {
                "type": "fractions",
                "display": f"{w1} {n1}/{d1} − {w2} {n2}/{d2} = ?",
                "answer": answer,
                "input_type": "fraction"
            }
        
        elif q_type == 'multiply':
            # Fraction multiplication: 2/3 × 3/4 = 1/2
            n1, d1 = random.randint(2, 5), random.randint(3, 6)
            n2, d2 = random.randint(2, 5), random.randint(3, 6)
            result_n = n1 * n2
            result_d = d1 * d2
            gcd = math.gcd(result_n, result_d)
            
            simplified_n = result_n // gcd
            simplified_d = result_d // gcd
            
            if simplified_n >= simplified_d:
                whole = simplified_n // simplified_d
                remainder = simplified_n % simplified_d
                if remainder == 0:
                    answer = str(whole)
                else:
                    answer = f"{whole} {remainder}/{simplified_d}"
            else:
                answer = f"{simplified_n}/{simplified_d}"
            
            return {
                "type": "fractions",
                "display": f"{n1}/{d1} × {n2}/{d2} = ?",
                "answer": answer,
                "input_type": "fraction"
            }
        
        else:  # divide
            # Fraction division: 3/4 ÷ 1/2 = 3/2 = 1½
            n1, d1 = random.randint(2, 5), random.randint(3, 6)
            n2, d2 = random.randint(1, 3), random.randint(2, 4)
            
            # Invert and multiply
            result_n = n1 * d2
            result_d = d1 * n2
            gcd = math.gcd(result_n, result_d)
            
            simplified_n = result_n // gcd
            simplified_d = result_d // gcd
            
            if simplified_n >= simplified_d:
                whole = simplified_n // simplified_d
                remainder = simplified_n % simplified_d
                if remainder == 0:
                    answer = str(whole)
                else:
                    answer = f"{whole} {remainder}/{simplified_d}"
            else:
                answer = f"{simplified_n}/{simplified_d}"
            
            return {
                "type": "fractions",
                "display": f"{n1}/{d1} ÷ {n2}/{d2} = ?",
                "answer": answer,
                "input_type": "fraction"
            }


def generate_equations(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Equations - solve for x:
    Easy (max_val <= 10):
      - x + 5 = 12
      - x - 3 = 7
      - 3 × x = 15
      - x ÷ 4 = 3
    Medium (max_val <= 50):
      - 2x + 6 = 12
      - 3x - 4 = 11
    Hard (max_val > 50):
      - 2x + 6 = 12 (with larger numbers)
      - Decimals: 2.5x + 3 = 8
      - Negative: -2x + 4 = 10
    """
    
    # Determine difficulty level
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        # Simple equations
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
    
    elif is_medium:
        # Medium: ax + b = c or ax - b = c
        eq_type = random.choice(['coeff_add', 'coeff_subtract', 'simple_add', 'simple_multiply'])
        
        if eq_type == 'coeff_add':
            # 2x + 6 = 12 -> x = 3
            x = random.randint(1, 15)
            a = random.randint(2, 5)  # coefficient
            b = random.randint(1, 20)  # constant
            c = a * x + b
            return {
                "type": "equations",
                "display": f"{a}x + {b} = {c}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }
        
        elif eq_type == 'coeff_subtract':
            # 3x - 4 = 11 -> x = 5
            x = random.randint(2, 15)
            a = random.randint(2, 5)  # coefficient
            b = random.randint(1, min(10, a * x - 1))  # constant (ensure positive result)
            c = a * x - b
            return {
                "type": "equations",
                "display": f"{a}x − {b} = {c}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }
        
        elif eq_type == 'simple_add':
            x = random.randint(5, 30)
            a = random.randint(5, 30)
            b = x + a
            return {
                "type": "equations",
                "display": f"x + {a} = {b}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }
        
        else:  # simple_multiply with larger numbers
            x = random.randint(2, 12)
            a = random.randint(3, 12)
            b = a * x
            return {
                "type": "equations",
                "display": f"{a} × x = {b}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }
    
    else:  # is_hard
        # Hard: with decimals and negatives
        eq_type = random.choice(['coeff_add', 'coeff_subtract', 'negative', 'decimal'])
        
        if eq_type == 'coeff_add':
            # Larger numbers: 4x + 15 = 47
            x = random.randint(5, 25)
            a = random.randint(2, 8)
            b = random.randint(10, 50)
            c = a * x + b
            return {
                "type": "equations",
                "display": f"{a}x + {b} = {c}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }
        
        elif eq_type == 'coeff_subtract':
            # 5x - 12 = 28 -> x = 8
            x = random.randint(5, 20)
            a = random.randint(2, 8)
            b = random.randint(5, 30)
            c = a * x - b
            return {
                "type": "equations",
                "display": f"{a}x − {b} = {c}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }
        
        elif eq_type == 'negative':
            # -2x + 10 = 4 -> x = 3, or x can be negative
            neg_type = random.choice(['neg_coeff', 'neg_answer'])
            
            if neg_type == 'neg_coeff':
                # -2x + 10 = 4 -> -2x = -6 -> x = 3
                x = random.randint(1, 10)
                a = random.randint(2, 5)
                b = random.randint(a * x + 1, a * x + 20)
                c = b - a * x
                return {
                    "type": "equations",
                    "display": f"−{a}x + {b} = {c}",
                    "answer": x,
                    "input_type": "number",
                    "hint": "x = ?"
                }
            else:
                # 2x + 10 = 4 -> x = -3
                x = random.randint(-10, -1)
                a = random.randint(2, 5)
                b = random.randint(10, 30)
                c = a * x + b
                return {
                    "type": "equations",
                    "display": f"{a}x + {b} = {c}",
                    "answer": x,
                    "input_type": "number",
                    "hint": "x = ?"
                }
        
        else:  # decimal
            # 2.5x + 3 = 8 -> x = 2
            x = random.randint(1, 8)
            a_whole = random.randint(1, 4)
            a_decimal = random.choice([0.5, 1.5, 2.5])
            a = a_whole + a_decimal - a_whole  # Just use the decimal part
            a = random.choice([1.5, 2.5, 3.5, 0.5])
            b = random.randint(1, 10)
            c = a * x + b
            # Round to avoid floating point issues
            c = round(c, 1)
            return {
                "type": "equations",
                "display": f"{a}x + {b} = {c}",
                "answer": x,
                "input_type": "number",
                "hint": "x = ?"
            }


def generate_geometry(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Geometry - area and perimeter with difficulty scaling:
    
    Easy (max_val <= 10):
      - Rectangle area/perimeter (small numbers)
      - Square area/perimeter
      - Triangle area
    
    Medium (max_val 11-50):
      - Circle area and circumference
      - Parallelogram area
      - Larger numbers for basic shapes
    
    Hard (max_val > 50):
      - Trapezoid area
      - Rhombus area
      - Rectangular prism volume
      - Compound shapes (L-shapes)
    """
    texts = {
        "sv": {
            "rect_area": "Vad är arean på en rektangel med sidorna {w} och {h}?",
            "rect_perimeter": "Vad är omkretsen på en rektangel med sidorna {w} och {h}?",
            "square_area": "Vad är arean på en kvadrat med sidan {s}?",
            "square_perimeter": "Vad är omkretsen på en kvadrat med sidan {s}?",
            "triangle_area": "Vad är arean på en triangel med basen {b} och höjden {h}?",
            "circle_area": "Vad är arean på en cirkel med radien {r}? (Svara i π, t.ex. 25π)",
            "circle_circumference": "Vad är omkretsen på en cirkel med radien {r}? (Svara i π, t.ex. 10π)",
            "parallelogram_area": "Vad är arean på en parallellogram med basen {b} och höjden {h}?",
            "trapezoid_area": "Vad är arean på en trapets med parallella sidor {a} och {b}, och höjden {h}?",
            "rhombus_area": "Vad är arean på en romb med diagonalerna {d1} och {d2}?",
            "prism_volume": "Vad är volymen på ett rätblock med sidorna {l}, {w} och {h}?",
            "l_shape_area": "En L-formad figur har yttre mått {w}×{h} och ett uthugget hörn på {cw}×{ch}. Vad är arean?",
        },
        "en": {
            "rect_area": "What is the area of a rectangle with sides {w} and {h}?",
            "rect_perimeter": "What is the perimeter of a rectangle with sides {w} and {h}?",
            "square_area": "What is the area of a square with side {s}?",
            "square_perimeter": "What is the perimeter of a square with side {s}?",
            "triangle_area": "What is the area of a triangle with base {b} and height {h}?",
            "circle_area": "What is the area of a circle with radius {r}? (Answer in π, e.g. 25π)",
            "circle_circumference": "What is the circumference of a circle with radius {r}? (Answer in π, e.g. 10π)",
            "parallelogram_area": "What is the area of a parallelogram with base {b} and height {h}?",
            "trapezoid_area": "What is the area of a trapezoid with parallel sides {a} and {b}, and height {h}?",
            "rhombus_area": "What is the area of a rhombus with diagonals {d1} and {d2}?",
            "prism_volume": "What is the volume of a rectangular prism with sides {l}, {w} and {h}?",
            "l_shape_area": "An L-shaped figure has outer dimensions {w}×{h} and a cut corner of {cw}×{ch}. What is the area?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        shape = random.choice(['rect_area', 'rect_perimeter', 'square_area', 'square_perimeter', 'triangle_area'])
        
        if shape == 'rect_area':
            w = random.randint(2, min(10, max_val))
            h = random.randint(2, min(10, max_val))
            return {
                "type": "geometry",
                "display": t["rect_area"].format(w=w, h=h),
                "answer": w * h,
                "input_type": "number",
                "shape": "rectangle",
                "dimensions": {"width": w, "height": h}
            }
        
        elif shape == 'rect_perimeter':
            w = random.randint(2, min(10, max_val))
            h = random.randint(2, min(10, max_val))
            return {
                "type": "geometry",
                "display": t["rect_perimeter"].format(w=w, h=h),
                "answer": 2 * (w + h),
                "input_type": "number",
                "shape": "rectangle",
                "dimensions": {"width": w, "height": h}
            }
        
        elif shape == 'square_area':
            s = random.randint(2, min(10, max_val))
            return {
                "type": "geometry",
                "display": t["square_area"].format(s=s),
                "answer": s * s,
                "input_type": "number",
                "shape": "square",
                "dimensions": {"side": s}
            }
        
        elif shape == 'square_perimeter':
            s = random.randint(2, min(10, max_val))
            return {
                "type": "geometry",
                "display": t["square_perimeter"].format(s=s),
                "answer": 4 * s,
                "input_type": "number",
                "shape": "square",
                "dimensions": {"side": s}
            }
        
        else:  # triangle_area
            b = random.randint(2, min(10, max_val)) * 2  # Even base for clean division
            h = random.randint(2, min(10, max_val))
            return {
                "type": "geometry",
                "display": t["triangle_area"].format(b=b, h=h),
                "answer": (b * h) // 2,
                "input_type": "number",
                "shape": "triangle",
                "dimensions": {"base": b, "height": h}
            }
    
    elif is_medium:
        shape = random.choice(['rect_area', 'rect_perimeter', 'square_area', 'triangle_area', 
                               'circle_area', 'circle_circumference', 'parallelogram_area'])
        
        if shape == 'rect_area':
            w = random.randint(5, 20)
            h = random.randint(5, 20)
            return {
                "type": "geometry",
                "display": t["rect_area"].format(w=w, h=h),
                "answer": w * h,
                "input_type": "number",
                "shape": "rectangle",
                "dimensions": {"width": w, "height": h}
            }
        
        elif shape == 'rect_perimeter':
            w = random.randint(5, 25)
            h = random.randint(5, 25)
            return {
                "type": "geometry",
                "display": t["rect_perimeter"].format(w=w, h=h),
                "answer": 2 * (w + h),
                "input_type": "number",
                "shape": "rectangle",
                "dimensions": {"width": w, "height": h}
            }
        
        elif shape == 'square_area':
            s = random.randint(5, 15)
            return {
                "type": "geometry",
                "display": t["square_area"].format(s=s),
                "answer": s * s,
                "input_type": "number",
                "shape": "square",
                "dimensions": {"side": s}
            }
        
        elif shape == 'triangle_area':
            b = random.randint(4, 20) * 2  # Even base
            h = random.randint(4, 20)
            return {
                "type": "geometry",
                "display": t["triangle_area"].format(b=b, h=h),
                "answer": (b * h) // 2,
                "input_type": "number",
                "shape": "triangle",
                "dimensions": {"base": b, "height": h}
            }
        
        elif shape == 'circle_area':
            # Area = πr², answer in terms of π (e.g., "25π")
            r = random.randint(2, 10)
            return {
                "type": "geometry",
                "display": t["circle_area"].format(r=r),
                "answer": f"{r * r}π",
                "input_type": "text",
                "shape": "circle",
                "dimensions": {"radius": r}
            }
        
        elif shape == 'circle_circumference':
            # Circumference = 2πr, answer in terms of π (e.g., "10π")
            r = random.randint(2, 10)
            return {
                "type": "geometry",
                "display": t["circle_circumference"].format(r=r),
                "answer": f"{2 * r}π",
                "input_type": "text",
                "shape": "circle",
                "dimensions": {"radius": r}
            }
        
        else:  # parallelogram_area
            b = random.randint(5, 15)
            h = random.randint(3, 12)
            return {
                "type": "geometry",
                "display": t["parallelogram_area"].format(b=b, h=h),
                "answer": b * h,
                "input_type": "number",
                "shape": "parallelogram",
                "dimensions": {"base": b, "height": h}
            }
    
    else:  # is_hard
        shape = random.choice(['trapezoid_area', 'rhombus_area', 'prism_volume', 'l_shape_area',
                               'circle_area', 'circle_circumference', 'triangle_area'])
        
        if shape == 'trapezoid_area':
            # Area = (a + b) × h / 2
            a = random.randint(6, 15)
            b = random.randint(10, 25)
            if a > b:
                a, b = b, a
            # Ensure (a + b) is even for clean division
            if (a + b) % 2 != 0:
                b += 1
            h = random.randint(4, 12)
            return {
                "type": "geometry",
                "display": t["trapezoid_area"].format(a=a, b=b, h=h),
                "answer": ((a + b) * h) // 2,
                "input_type": "number",
                "shape": "trapezoid",
                "dimensions": {"side_a": a, "side_b": b, "height": h}
            }
        
        elif shape == 'rhombus_area':
            # Area = (d1 × d2) / 2
            d1 = random.randint(4, 16) * 2  # Even for clean division
            d2 = random.randint(4, 16)
            return {
                "type": "geometry",
                "display": t["rhombus_area"].format(d1=d1, d2=d2),
                "answer": (d1 * d2) // 2,
                "input_type": "number",
                "shape": "rhombus",
                "dimensions": {"diagonal1": d1, "diagonal2": d2}
            }
        
        elif shape == 'prism_volume':
            # Volume = l × w × h
            l = random.randint(3, 12)
            w = random.randint(3, 12)
            h = random.randint(3, 12)
            return {
                "type": "geometry",
                "display": t["prism_volume"].format(l=l, w=w, h=h),
                "answer": l * w * h,
                "input_type": "number",
                "shape": "rectangular_prism",
                "dimensions": {"length": l, "width": w, "height": h}
            }
        
        elif shape == 'l_shape_area':
            # L-shape: large rectangle minus a corner rectangle
            w = random.randint(8, 15)
            h = random.randint(8, 15)
            cw = random.randint(2, w - 3)  # Corner width
            ch = random.randint(2, h - 3)  # Corner height
            total_area = w * h - cw * ch
            return {
                "type": "geometry",
                "display": t["l_shape_area"].format(w=w, h=h, cw=cw, ch=ch),
                "answer": total_area,
                "input_type": "number",
                "shape": "l_shape",
                "dimensions": {"width": w, "height": h, "corner_width": cw, "corner_height": ch}
            }
        
        elif shape == 'circle_area':
            r = random.randint(5, 15)
            return {
                "type": "geometry",
                "display": t["circle_area"].format(r=r),
                "answer": f"{r * r}π",
                "input_type": "text",
                "shape": "circle",
                "dimensions": {"radius": r}
            }
        
        elif shape == 'circle_circumference':
            r = random.randint(5, 15)
            return {
                "type": "geometry",
                "display": t["circle_circumference"].format(r=r),
                "answer": f"{2 * r}π",
                "input_type": "text",
                "shape": "circle",
                "dimensions": {"radius": r}
            }
        
        else:  # triangle_area with larger numbers
            b = random.randint(10, 30) * 2
            h = random.randint(10, 30)
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
    Percentage with difficulty scaling:
    
    Easy (max_val <= 10):
      - Simple: 10%, 25%, 50% of round numbers
      - Find: X is what % of Y (easy percentages)
    
    Medium (max_val 11-50):
      - More percentages: 15%, 30%, 35%, etc.
      - Percentage increase/decrease
      - Larger numbers
    
    Hard (max_val > 50):
      - Find original value (before % increase/decrease)
      - Complex percentages
      - Multi-step problems
    """
    texts = {
        "sv": {
            "of": "Hur mycket är {p}% av {n}?",
            "find": "Hur många procent är {part} av {whole}?",
            "increase": "Ett pris ökar med {p}%. Vad blir det nya priset om ursprungspriset är {n} kr?",
            "decrease": "Ett pris minskar med {p}%. Vad blir det nya priset om ursprungspriset är {n} kr?",
            "original_increase": "Efter en ökning på {p}% är priset {final} kr. Vad var ursprungspriset?",
            "original_decrease": "Efter en rabatt på {p}% är priset {final} kr. Vad var ursprungspriset?",
        },
        "en": {
            "of": "How much is {p}% of {n}?",
            "find": "What percentage is {part} of {whole}?",
            "increase": "A price increases by {p}%. What is the new price if the original was {n}?",
            "decrease": "A price decreases by {p}%. What is the new price if the original was {n}?",
            "original_increase": "After a {p}% increase, the price is {final}. What was the original price?",
            "original_decrease": "After a {p}% discount, the price is {final}. What was the original price?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        q_type = random.choice(['of', 'find'])
        
        if q_type == 'of':
            percent = random.choice([10, 20, 25, 50])
            # Simple round numbers
            if percent == 25:
                base = random.choice([4, 8, 12, 16, 20, 40, 80, 100])
            else:
                base = random.choice([10, 20, 30, 40, 50, 100])
            
            answer = int((percent / 100) * base)
            return {
                "type": "percentage",
                "display": t["of"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # find
            whole = random.choice([10, 20, 50, 100])
            percent = random.choice([10, 25, 50])
            part = int((percent / 100) * whole)
            return {
                "type": "percentage",
                "display": t["find"].format(part=part, whole=whole),
                "answer": percent,
                "input_type": "number"
            }
    
    elif is_medium:
        q_type = random.choice(['of', 'find', 'increase', 'decrease'])
        
        if q_type == 'of':
            percent = random.choice([10, 15, 20, 25, 30, 35, 50, 75])
            if percent in [25, 75]:
                base = random.choice([40, 80, 120, 200, 400])
            elif percent in [15, 35]:
                base = random.choice([20, 40, 60, 100, 200])
            else:
                base = random.choice([50, 100, 150, 200, 250, 300])
            
            answer = int((percent / 100) * base)
            return {
                "type": "percentage",
                "display": t["of"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'find':
            whole = random.choice([40, 50, 80, 100, 200, 250])
            percent = random.choice([10, 20, 25, 40, 50, 75])
            part = int((percent / 100) * whole)
            return {
                "type": "percentage",
                "display": t["find"].format(part=part, whole=whole),
                "answer": percent,
                "input_type": "number"
            }
        
        elif q_type == 'increase':
            percent = random.choice([10, 20, 25, 50])
            base = random.choice([100, 200, 400, 500])
            answer = int(base * (1 + percent / 100))
            return {
                "type": "percentage",
                "display": t["increase"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # decrease
            percent = random.choice([10, 20, 25, 50])
            base = random.choice([100, 200, 400, 500])
            answer = int(base * (1 - percent / 100))
            return {
                "type": "percentage",
                "display": t["decrease"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
    
    else:  # is_hard
        q_type = random.choice(['of', 'increase', 'decrease', 'original_increase', 'original_decrease'])
        
        if q_type == 'of':
            percent = random.choice([12, 15, 18, 22, 35, 45, 65, 85])
            # Ensure clean answer
            base = random.choice([100, 200, 500, 1000])
            answer = int((percent / 100) * base)
            return {
                "type": "percentage",
                "display": t["of"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'increase':
            percent = random.choice([15, 25, 30, 40])
            base = random.choice([200, 400, 500, 800, 1000])
            answer = int(base * (1 + percent / 100))
            return {
                "type": "percentage",
                "display": t["increase"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'decrease':
            percent = random.choice([15, 25, 30, 40])
            base = random.choice([200, 400, 500, 800, 1000])
            answer = int(base * (1 - percent / 100))
            return {
                "type": "percentage",
                "display": t["decrease"].format(p=percent, n=base),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'original_increase':
            # After X% increase, price is Y. What was original?
            percent = random.choice([10, 20, 25, 50])
            original = random.choice([100, 200, 400, 500, 800])
            final = int(original * (1 + percent / 100))
            return {
                "type": "percentage",
                "display": t["original_increase"].format(p=percent, final=final),
                "answer": original,
                "input_type": "number"
            }
        
        else:  # original_decrease
            # After X% discount, price is Y. What was original?
            percent = random.choice([10, 20, 25, 50])
            original = random.choice([100, 200, 400, 500, 800])
            final = int(original * (1 - percent / 100))
            return {
                "type": "percentage",
                "display": t["original_decrease"].format(p=percent, final=final),
                "answer": original,
                "input_type": "number"
            }


def generate_units(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Unit conversion with difficulty scaling:
    
    Easy (max_val <= 10):
      - Simple conversions: m→cm, kg→g, l→dl
      - Small numbers (1-5)
    
    Medium (max_val 11-50):
      - More unit types: km→m, l→ml, h→min
      - Larger numbers
      - Decimal values
    
    Hard (max_val > 50):
      - Multi-step: km→cm, h→sek
      - Decimal conversions
      - Area/volume units: m²→cm², m³→l
    """
    texts = {
        "sv": {
            "to_small": "Hur många {small} är {value} {big}?",
            "to_big": "Hur många {big} är {value} {small}?",
            "decimal_to_small": "Hur många {small} är {value} {big}?",
            "multi_step": "Hur många {small} är {value} {big}?",
            "area": "Hur många {small} är {value} {big}?",
        },
        "en": {
            "to_small": "How many {small} is {value} {big}?",
            "to_big": "How many {big} is {value} {small}?",
            "decimal_to_small": "How many {small} is {value} {big}?",
            "multi_step": "How many {small} is {value} {big}?",
            "area": "How many {small} is {value} {big}?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        # Simple conversions with small numbers
        conversions = [
            ("m", "cm", 100, "meter", "centimeter"),
            ("kg", "g", 1000, "kilogram", "gram"),
            ("l", "dl", 10, "liter", "deciliter"),
            ("h", "min", 60, "timmar", "minuter"),
        ]
        
        conv = random.choice(conversions)
        big_unit, small_unit, factor, big_name, small_name = conv
        
        direction = random.choice(['to_small', 'to_big'])
        
        if direction == 'to_small':
            value = random.randint(1, 5)
            answer = value * factor
            return {
                "type": "units",
                "display": t["to_small"].format(small=small_name, value=value, big=big_name),
                "answer": answer,
                "input_type": "number"
            }
        else:
            value = random.randint(1, 5) * factor
            answer = value // factor
            return {
                "type": "units",
                "display": t["to_big"].format(big=big_name, value=value, small=small_name),
                "answer": answer,
                "input_type": "number"
            }
    
    elif is_medium:
        # More unit types and larger numbers
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
        
        q_type = random.choice(['to_small', 'to_big', 'decimal'])
        
        if q_type == 'to_small':
            value = random.randint(2, 15)
            answer = value * factor
            return {
                "type": "units",
                "display": t["to_small"].format(small=small_name, value=value, big=big_name),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'to_big':
            value = random.randint(2, 10) * factor
            answer = value // factor
            return {
                "type": "units",
                "display": t["to_big"].format(big=big_name, value=value, small=small_name),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # decimal
            # e.g., 2.5 m = 250 cm
            decimal_vals = [0.5, 1.5, 2.5, 3.5]
            value = random.choice(decimal_vals)
            answer = int(value * factor)
            return {
                "type": "units",
                "display": t["decimal_to_small"].format(small=small_name, value=value, big=big_name),
                "answer": answer,
                "input_type": "number"
            }
    
    else:  # is_hard
        q_type = random.choice(['multi_step', 'decimal_large', 'area', 'time'])
        
        if q_type == 'multi_step':
            # km → cm (1 km = 100,000 cm)
            multi_conversions = [
                ("km", "cm", 100000, "kilometer", "centimeter"),
                ("km", "mm", 1000000, "kilometer", "millimeter"),
                ("h", "sek", 3600, "timmar", "sekunder"),
            ]
            conv = random.choice(multi_conversions)
            big_unit, small_unit, factor, big_name, small_name = conv
            
            value = random.randint(1, 3)
            answer = value * factor
            return {
                "type": "units",
                "display": t["multi_step"].format(small=small_name, value=value, big=big_name),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'decimal_large':
            conversions = [
                ("km", "m", 1000, "kilometer", "meter"),
                ("kg", "g", 1000, "kilogram", "gram"),
                ("l", "ml", 1000, "liter", "milliliter"),
            ]
            conv = random.choice(conversions)
            big_unit, small_unit, factor, big_name, small_name = conv
            
            # e.g., 3.75 km = 3750 m
            whole = random.randint(1, 5)
            decimal = random.choice([0.25, 0.5, 0.75])
            value = whole + decimal
            answer = int(value * factor)
            return {
                "type": "units",
                "display": t["decimal_to_small"].format(small=small_name, value=value, big=big_name),
                "answer": answer,
                "input_type": "number"
            }
        
        elif q_type == 'area':
            # m² → cm² (1 m² = 10,000 cm²)
            value = random.randint(1, 3)
            answer = value * 10000
            return {
                "type": "units",
                "display": t["area"].format(small="cm²", value=value, big="m²"),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # time
            # Complex time: 2 h 30 min = ? min
            hours = random.randint(1, 3)
            mins = random.choice([15, 30, 45])
            total_mins = hours * 60 + mins
            
            texts_time = {
                "sv": f"Hur många minuter är {hours} timmar och {mins} minuter?",
                "en": f"How many minutes is {hours} hours and {mins} minutes?",
            }
            
            return {
                "type": "units",
                "display": texts_time.get(lang, texts_time["sv"]),
                "answer": total_mins,
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
    Rounding with difficulty scaling:
    
    Easy (max_val <= 10):
      - Round to whole number (1 decimal)
      - Round to nearest ten (small numbers)
    
    Medium (max_val 11-50):
      - Round to one decimal (2 decimals)
      - Round to nearest hundred
      - Larger numbers
    
    Hard (max_val > 50):
      - Round to two decimals (3 decimals)
      - Round to nearest thousand
      - Very large numbers
    """
    texts = {
        "sv": {
            "whole": "Vad blir {n} avrundat till heltal?",
            "tens": "Vad blir {n} avrundat till närmaste tiotal?",
            "decimal": "Vad blir {n} avrundat till en decimal?",
            "hundreds": "Vad blir {n} avrundat till närmaste hundratal?",
            "two_decimals": "Vad blir {n} avrundat till två decimaler?",
            "thousands": "Vad blir {n} avrundat till närmaste tusental?",
        },
        "en": {
            "whole": "What is {n} rounded to a whole number?",
            "tens": "What is {n} rounded to the nearest ten?",
            "decimal": "What is {n} rounded to one decimal?",
            "hundreds": "What is {n} rounded to the nearest hundred?",
            "two_decimals": "What is {n} rounded to two decimals?",
            "thousands": "What is {n} rounded to the nearest thousand?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        round_type = random.choice(['whole', 'tens'])
        
        if round_type == 'whole':
            # Small number with one decimal
            whole = random.randint(1, 20)
            decimal = random.randint(1, 9)
            num = whole + decimal / 10
            answer = int(math_round(num, 0))
            return {
                "type": "rounding",
                "display": t["whole"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # tens
            num = random.randint(11, 99)
            answer = int(math_round(num / 10, 0) * 10)
            return {
                "type": "rounding",
                "display": t["tens"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }
    
    elif is_medium:
        round_type = random.choice(['whole', 'decimal', 'tens', 'hundreds'])
        
        if round_type == 'whole':
            whole = random.randint(10, 100)
            decimal = random.randint(1, 9)
            num = whole + decimal / 10
            answer = int(math_round(num, 0))
            return {
                "type": "rounding",
                "display": t["whole"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }
        
        elif round_type == 'decimal':
            # Two decimals → one decimal
            whole = random.randint(0, 50)
            first_dec = random.randint(0, 9)
            second_dec = random.randint(1, 9)
            num = whole + first_dec / 10 + second_dec / 100
            num = round(num, 2)
            answer = math_round(num, 1)
            return {
                "type": "rounding",
                "display": t["decimal"].format(n=num),
                "answer": answer,
                "input_type": "decimal"
            }
        
        elif round_type == 'tens':
            num = random.randint(100, 500)
            answer = int(math_round(num / 10, 0) * 10)
            return {
                "type": "rounding",
                "display": t["tens"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # hundreds
            num = random.randint(100, 999)
            answer = int(math_round(num / 100, 0) * 100)
            return {
                "type": "rounding",
                "display": t["hundreds"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }
    
    else:  # is_hard
        round_type = random.choice(['decimal', 'two_decimals', 'hundreds', 'thousands'])
        
        if round_type == 'decimal':
            # Two decimals → one decimal (larger numbers)
            whole = random.randint(50, 200)
            first_dec = random.randint(0, 9)
            second_dec = random.randint(1, 9)
            num = whole + first_dec / 10 + second_dec / 100
            num = round(num, 2)
            answer = math_round(num, 1)
            return {
                "type": "rounding",
                "display": t["decimal"].format(n=num),
                "answer": answer,
                "input_type": "decimal"
            }
        
        elif round_type == 'two_decimals':
            # Three decimals → two decimals
            whole = random.randint(0, 50)
            first_dec = random.randint(0, 9)
            second_dec = random.randint(0, 9)
            third_dec = random.randint(1, 9)
            num = whole + first_dec / 10 + second_dec / 100 + third_dec / 1000
            num = round(num, 3)
            answer = math_round(num, 2)
            return {
                "type": "rounding",
                "display": t["two_decimals"].format(n=num),
                "answer": answer,
                "input_type": "decimal"
            }
        
        elif round_type == 'hundreds':
            num = random.randint(1000, 9999)
            answer = int(math_round(num / 100, 0) * 100)
            return {
                "type": "rounding",
                "display": t["hundreds"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # thousands
            num = random.randint(1000, 9999)
            answer = int(math_round(num / 1000, 0) * 1000)
            return {
                "type": "rounding",
                "display": t["thousands"].format(n=num),
                "answer": answer,
                "input_type": "number"
            }


def generate_angles(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Angles with difficulty scaling:
    
    Easy (max_val <= 10):
      - Complement (90°)
      - Triangle angles (simple)
    
    Medium (max_val 11-50):
      - Supplement (180°)
      - Quadrilateral (360°)
      - Isosceles triangle
    
    Hard (max_val > 50):
      - Polygon angles
      - Exterior angles
      - Multiple angle relationships
    """
    texts = {
        "sv": {
            "complement": "Vad är komplementvinkeln till {a}°?",
            "supplement": "Vad är supplementvinkeln till {a}°?",
            "triangle": "En triangel har två vinklar på {a}° och {b}°. Hur stor är den tredje vinkeln?",
            "quadrilateral": "En fyrhörning har tre vinklar på {a}°, {b}° och {c}°. Hur stor är den fjärde vinkeln?",
            "isosceles": "En likbent triangel har en topp-vinkel på {a}°. Hur stora är basvinklarna?",
            "polygon": "Hur stor är vinkelsumman i en {n}-hörning?",
            "exterior": "Vad är yttervinkeln till en inre vinkel på {a}°?",
            "regular_polygon": "Hur stor är varje inre vinkel i en regelbunden {n}-hörning?",
        },
        "en": {
            "complement": "What is the complement of {a}°?",
            "supplement": "What is the supplement of {a}°?",
            "triangle": "A triangle has two angles of {a}° and {b}°. What is the third angle?",
            "quadrilateral": "A quadrilateral has three angles of {a}°, {b}° and {c}°. What is the fourth angle?",
            "isosceles": "An isosceles triangle has a vertex angle of {a}°. What are the base angles?",
            "polygon": "What is the sum of angles in a {n}-gon?",
            "exterior": "What is the exterior angle to an interior angle of {a}°?",
            "regular_polygon": "What is each interior angle of a regular {n}-gon?",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
        angle_type = random.choice(['complement', 'triangle'])
        
        if angle_type == 'complement':
            angle = random.choice([30, 40, 45, 50, 60])
            return {
                "type": "angles",
                "display": t["complement"].format(a=angle),
                "answer": 90 - angle,
                "input_type": "number"
            }
        
        else:  # triangle
            a = random.choice([30, 40, 50, 60, 70])
            b = random.choice([30, 40, 50, 60, 70])
            while a + b >= 170:
                b = random.choice([30, 40, 50, 60])
            c = 180 - a - b
            return {
                "type": "angles",
                "display": t["triangle"].format(a=a, b=b),
                "answer": c,
                "input_type": "number"
            }
    
    elif is_medium:
        angle_type = random.choice(['supplement', 'triangle', 'quadrilateral', 'isosceles'])
        
        if angle_type == 'supplement':
            angle = random.randint(20, 160)
            return {
                "type": "angles",
                "display": t["supplement"].format(a=angle),
                "answer": 180 - angle,
                "input_type": "number"
            }
        
        elif angle_type == 'triangle':
            a = random.randint(25, 85)
            b = random.randint(25, 145 - a)
            c = 180 - a - b
            return {
                "type": "angles",
                "display": t["triangle"].format(a=a, b=b),
                "answer": c,
                "input_type": "number"
            }
        
        elif angle_type == 'quadrilateral':
            a = random.randint(60, 100)
            b = random.randint(60, 100)
            c = random.randint(60, 100)
            d = 360 - a - b - c
            # Ensure d is positive and reasonable
            while d <= 0 or d > 180:
                a = random.randint(70, 100)
                b = random.randint(70, 100)
                c = random.randint(70, 100)
                d = 360 - a - b - c
            return {
                "type": "angles",
                "display": t["quadrilateral"].format(a=a, b=b, c=c),
                "answer": d,
                "input_type": "number"
            }
        
        else:  # isosceles
            # Vertex angle, base angles are (180 - vertex) / 2
            vertex = random.choice([20, 40, 60, 80, 100])
            base = (180 - vertex) // 2
            return {
                "type": "angles",
                "display": t["isosceles"].format(a=vertex),
                "answer": base,
                "input_type": "number"
            }
    
    else:  # is_hard
        angle_type = random.choice(['polygon', 'exterior', 'regular_polygon', 'quadrilateral'])
        
        if angle_type == 'polygon':
            # Sum = (n - 2) × 180
            n = random.choice([5, 6, 7, 8])
            names = {5: "femhörning", 6: "sexhörning", 7: "sjuhörning", 8: "åttahörning"}
            names_en = {5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon"}
            polygon_name = names.get(n, f"{n}-hörning") if lang == "sv" else names_en.get(n, f"{n}-gon")
            answer = (n - 2) * 180
            return {
                "type": "angles",
                "display": t["polygon"].format(n=polygon_name),
                "answer": answer,
                "input_type": "number"
            }
        
        elif angle_type == 'exterior':
            # Exterior angle = 180 - interior
            interior = random.randint(60, 150)
            return {
                "type": "angles",
                "display": t["exterior"].format(a=interior),
                "answer": 180 - interior,
                "input_type": "number"
            }
        
        elif angle_type == 'regular_polygon':
            # Each interior angle = (n - 2) × 180 / n
            n = random.choice([4, 5, 6, 8])  # Choose n where result is a whole number
            names = {4: "fyrhörning", 5: "femhörning", 6: "sexhörning", 8: "åttahörning"}
            names_en = {4: "quadrilateral", 5: "pentagon", 6: "hexagon", 8: "octagon"}
            polygon_name = names.get(n, f"{n}-hörning") if lang == "sv" else names_en.get(n, f"{n}-gon")
            answer = ((n - 2) * 180) // n
            return {
                "type": "angles",
                "display": t["regular_polygon"].format(n=polygon_name),
                "answer": answer,
                "input_type": "number"
            }
        
        else:  # quadrilateral with harder numbers
            a = random.randint(50, 120)
            b = random.randint(50, 120)
            c = random.randint(50, 120)
            d = 360 - a - b - c
            while d <= 0 or d > 180:
                a = random.randint(70, 110)
                b = random.randint(70, 110)
                c = random.randint(70, 110)
                d = 360 - a - b - c
            return {
                "type": "angles",
                "display": t["quadrilateral"].format(a=a, b=b, c=c),
                "answer": d,
                "input_type": "number"
            }


def generate_probability(min_val: int, max_val: int, lang: str = "sv") -> Dict[str, Any]:
    """
    Probability with difficulty scaling:
    
    Easy (max_val <= 10):
      - Simple dice, coin
      - Basic marble problems
    
    Medium (max_val 11-50):
      - Combined events (dice OR)
      - More complex marble problems
      - Multiple draws
    
    Hard (max_val > 50):
      - Combined events (AND)
      - Conditional probability (simple)
      - Cards
    """
    texts = {
        "sv": {
            "dice": "Hur stor är sannolikheten att slå en {n}:a med en tärning? Svara som bråk.",
            "coin": "Hur stor är sannolikheten att få krona när man singlar slant? Svara som bråk.",
            "marble": "I en påse finns {r} röda och {b} blå kulor. Hur stor är sannolikheten att dra en röd? Svara som bråk.",
            "dice_or": "Hur stor är sannolikheten att slå en {a}:a eller en {b}:a med en tärning? Svara som bråk.",
            "dice_less": "Hur stor är sannolikheten att slå mindre än {n} med en tärning? Svara som bråk.",
            "dice_greater": "Hur stor är sannolikheten att slå mer än {n} med en tärning? Svara som bråk.",
            "two_coins": "Du singlar två mynt. Vad är sannolikheten att få två kronor? Svara som bråk.",
            "two_dice": "Du kastar två tärningar. Vad är sannolikheten att båda visar {n}? Svara som bråk.",
            "card_color": "Vad är sannolikheten att dra ett rött kort (hjärter eller ruter) från en kortlek? Svara som bråk.",
            "card_face": "Vad är sannolikheten att dra en kung från en kortlek med 52 kort? Svara som bråk.",
        },
        "en": {
            "dice": "What is the probability of rolling a {n} with a dice? Answer as a fraction.",
            "coin": "What is the probability of getting heads when flipping a coin? Answer as a fraction.",
            "marble": "A bag contains {r} red and {b} blue marbles. What is the probability of drawing red? Answer as a fraction.",
            "dice_or": "What is the probability of rolling a {a} or a {b} with a dice? Answer as a fraction.",
            "dice_less": "What is the probability of rolling less than {n} with a dice? Answer as a fraction.",
            "dice_greater": "What is the probability of rolling more than {n} with a dice? Answer as a fraction.",
            "two_coins": "You flip two coins. What is the probability of getting two heads? Answer as a fraction.",
            "two_dice": "You roll two dice. What is the probability that both show {n}? Answer as a fraction.",
            "card_color": "What is the probability of drawing a red card (hearts or diamonds) from a deck? Answer as a fraction.",
            "card_face": "What is the probability of drawing a king from a 52-card deck? Answer as a fraction.",
        }
    }
    t = texts.get(lang, texts["sv"])
    
    is_easy = max_val <= 10
    is_medium = 10 < max_val <= 50
    is_hard = max_val > 50
    
    if is_easy:
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
            red = random.randint(1, 5)
            blue = random.randint(1, 5)
            total = red + blue
            gcd = math.gcd(red, total)
            return {
                "type": "probability",
                "display": t["marble"].format(r=red, b=blue),
                "answer": f"{red // gcd}/{total // gcd}",
                "input_type": "fraction"
            }
    
    elif is_medium:
        prob_type = random.choice(['dice_or', 'dice_less', 'dice_greater', 'marble'])
        
        if prob_type == 'dice_or':
            a, b = random.sample(range(1, 7), 2)
            if a > b:
                a, b = b, a
            # P(a or b) = 2/6 = 1/3
            return {
                "type": "probability",
                "display": t["dice_or"].format(a=a, b=b),
                "answer": "1/3",
                "input_type": "fraction"
            }
        
        elif prob_type == 'dice_less':
            n = random.choice([3, 4, 5])  # Less than n: 2, 3, or 4 outcomes
            outcomes = n - 1
            gcd = math.gcd(outcomes, 6)
            return {
                "type": "probability",
                "display": t["dice_less"].format(n=n),
                "answer": f"{outcomes // gcd}/{6 // gcd}",
                "input_type": "fraction"
            }
        
        elif prob_type == 'dice_greater':
            n = random.choice([2, 3, 4])  # Greater than n: 4, 3, or 2 outcomes
            outcomes = 6 - n
            gcd = math.gcd(outcomes, 6)
            return {
                "type": "probability",
                "display": t["dice_greater"].format(n=n),
                "answer": f"{outcomes // gcd}/{6 // gcd}",
                "input_type": "fraction"
            }
        
        else:  # marble with more balls
            red = random.randint(2, 8)
            blue = random.randint(2, 8)
            total = red + blue
            gcd = math.gcd(red, total)
            return {
                "type": "probability",
                "display": t["marble"].format(r=red, b=blue),
                "answer": f"{red // gcd}/{total // gcd}",
                "input_type": "fraction"
            }
    
    else:  # is_hard
        prob_type = random.choice(['two_coins', 'two_dice', 'card_color', 'card_face'])
        
        if prob_type == 'two_coins':
            # P(HH) = 1/2 × 1/2 = 1/4
            return {
                "type": "probability",
                "display": t["two_coins"],
                "answer": "1/4",
                "input_type": "fraction"
            }
        
        elif prob_type == 'two_dice':
            n = random.randint(1, 6)
            # P(both show n) = 1/6 × 1/6 = 1/36
            return {
                "type": "probability",
                "display": t["two_dice"].format(n=n),
                "answer": "1/36",
                "input_type": "fraction"
            }
        
        elif prob_type == 'card_color':
            # 26 red cards out of 52 = 1/2
            return {
                "type": "probability",
                "display": t["card_color"],
                "answer": "1/2",
                "input_type": "fraction"
            }
        
        else:  # card_face
            # 4 kings out of 52 = 1/13
            return {
                "type": "probability",
                "display": t["card_face"],
                "answer": "1/13",
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
