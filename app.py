from flask import Flask, render_template, request, jsonify
import re
import random

app = Flask(__name__)

# ゲームの難易度レベルと対応する正規表現問題
# 実際の問題数は初級50問、中級35問、上級15問
# ここでは一部のみ記載し、実際の実装では拡張する
LEVELS = {
    'beginner': [
        {'pattern': r'A+', 'description': '1つ以上の「A」にマッチする正規表現', 'examples': ['A', 'AA', 'AAA'], 'non_examples': ['B', 'BA', ''], 
         'hint1': '「+」記号は1回以上の繰り返しを表します', 'hint2': '文字「A」が1回以上繰り返される文字列にマッチさせるには「A+」と書きます'},
        {'pattern': r'[0-9]+', 'description': '1つ以上の数字にマッチする正規表現', 'examples': ['123', '0', '9876'], 'non_examples': ['abc', 'a1', ''], 
         'hint1': '「[]」は文字クラスを表し、その中に含まれる任意の1文字にマッチします', 'hint2': '[0-9]は任意の数字1文字を表し、「+」を付けると1回以上の繰り返しになります'},
        {'pattern': r'[a-z]{3}', 'description': '3つの小文字アルファベットにマッチする正規表現', 'examples': ['abc', 'xyz', 'def'], 'non_examples': ['ab', 'ABC', '123'], 
         'hint1': '「{n}」は直前のパターンがちょうどn回繰り返されることを表します', 'hint2': '[a-z]は小文字アルファベット1文字を表し、{3}を付けるとちょうど3文字になります'},
        {'pattern': r'B.*A', 'description': '「B」で始まり「A」で終わる文字列にマッチする正規表現', 'examples': ['BA', 'BCA', 'B123A'], 'non_examples': ['AB', 'B', 'ABC'], 
         'hint1': '「.」は任意の1文字にマッチし、「*」は直前のパターンが0回以上繰り返されることを表します', 'hint2': 'B.*Aは「B」の後に任意の文字が0文字以上続き、最後が「A」で終わる文字列にマッチします'},
        {'pattern': r'(AB)+', 'description': '「AB」の1回以上の繰り返しにマッチする正規表現', 'examples': ['AB', 'ABAB', 'ABABAB'], 'non_examples': ['A', 'BA', 'ABA'], 
         'hint1': '「()」はグループ化を表します', 'hint2': '(AB)+は「AB」というパターンが1回以上繰り返される文字列にマッチします'},
    ],
    'intermediate': [
        {'pattern': r'^[a-z]+[0-9]$', 'description': '小文字で始まり、数字で終わる文字列にマッチする正規表現', 'examples': ['abc1', 'z9', 'hello5'], 'non_examples': ['1abc', 'ABC1', 'abc'], 
         'hint1': '「^」は文字列の先頭、「$」は文字列の末尾を表します', 'hint2': '[a-z]+は1つ以上の小文字、[0-9]は1つの数字を表します'},
        {'pattern': r'\b\w+@\w+\.\w+\b', 'description': '簡単なメールアドレスパターンにマッチする正規表現', 'examples': ['user@example.com', 'a@b.c'], 'non_examples': ['@example.com', 'user@', 'user@example'], 
         'hint1': '「\\w」は英数字とアンダースコアにマッチします', 'hint2': 'メールアドレスは「名前@ドメイン.拡張子」の形式です。「\\.」はドットにマッチします'},
        {'pattern': r'^\d{3}-\d{4}$', 'description': '郵便番号形式（123-4567）にマッチする正規表現', 'examples': ['123-4567', '000-0000'], 'non_examples': ['1234-567', '123-456', '123-45678'], 
         'hint1': '「\\d」は数字1文字にマッチします', 'hint2': '郵便番号は3桁の数字、ハイフン、4桁の数字の形式です'},
        {'pattern': r'^(?!.*ABC).*$', 'description': '「ABC」を含まない文字列にマッチする正規表現', 'examples': ['XYZ', '123', 'ABXC'], 'non_examples': ['ABC', 'XABCY', '123ABC'], 
         'hint1': '「(?!パターン)」は否定先読みを表します', 'hint2': '(?!.*ABC)は「ABC」という部分文字列が含まれないことを確認します'},
        {'pattern': r'^\d+(\.\d{2})?$', 'description': '整数または小数点以下2桁の数値にマッチする正規表現', 'examples': ['123', '0.99', '50.00'], 'non_examples': ['123.', '123.456', 'abc'], 
         'hint1': '「(パターン)?」はそのパターンが0回または1回出現することを表します', 'hint2': '\\d+は1つ以上の数字、(\\.\\d{2})?は小数点と2桁の数字が0回または1回出現することを表します'},
    ],
    'advanced': [
        {'pattern': r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]{8,}$', 'description': '8文字以上で、少なくとも1つの大文字、小文字、数字を含むパスワードにマッチする正規表現', 'examples': ['Password123', 'Abcdef12'], 'non_examples': ['password', 'PASSWORD', 'Pass'], 
         'hint1': '「(?=.*パターン)」は先読み表現で、そのパターンが含まれることを確認します', 'hint2': '先読み表現を使って大文字、小文字、数字がそれぞれ含まれることを確認し、全体の長さを{8,}で8文字以上に制限します'},
        {'pattern': r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$', 'description': 'URLにマッチする正規表現', 'examples': ['https://example.com', 'www.example.co.jp/path'], 'non_examples': ['example', 'http://', 'https://example'], 
         'hint1': '「(パターン)?」はそのパターンが0回または1回出現することを表します', 'hint2': 'URLはプロトコル(http://)、ドメイン名、トップレベルドメイン(.com等)、パスの組み合わせです'},
        {'pattern': r'^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$', 'description': 'YYYY-MM-DD形式の日付にマッチする正規表現', 'examples': ['2023-01-31', '2020-12-25'], 'non_examples': ['2023/01/31', '2023-13-01', '2023-01-32'], 
         'hint1': '「|」は選択を表し、いずれかのパターンにマッチします', 'hint2': '月は01-12、日は01-31の範囲で、それぞれの範囲を正確に表現するには選択パターンを使います'},
        {'pattern': r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$', 'description': '8文字以上で、少なくとも1つの英字、数字、特殊文字を含むパスワードにマッチする正規表現', 'examples': ['Pass@123', 'hello#789'], 'non_examples': ['password', '12345678', 'Pass123'], 
         'hint1': '複数の先読み表現を組み合わせることで、複数の条件を同時に満たすことを確認できます', 'hint2': '英字、数字、特殊文字(@$!%*#?&)がそれぞれ含まれることを確認し、全体の長さを{8,}で8文字以上に制限します'},
        {'pattern': r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', 'description': 'IPv4アドレスにマッチする正規表現', 'examples': ['192.168.1.1', '10.0.0.1', '255.255.255.0'], 'non_examples': ['256.0.0.1', '192.168.1', '192.168.1.1.1'], 
         'hint1': '「(?:パターン)」は非キャプチャグループを表します', 'hint2': 'IPアドレスの各オクテットは0～255の範囲の数値で、それを4つのグループに分けて表現します'},
    ]
}

# 各セッションで使用済みの問題を追跡するための辞書
used_problems = {}

# 問題数の定義
PROBLEM_COUNTS = {
    'beginner': 50,
    'intermediate': 35,
    'advanced': 15
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    level = request.args.get('level', 'beginner')
    return render_template('game.html', level=level)

@app.route('/solutions')
def solutions():
    level = request.args.get('level', 'all')
    
    if level == 'all':
        return render_template('solutions.html', levels=LEVELS, problem_counts=PROBLEM_COUNTS)
    elif level in LEVELS:
        # 特定の難易度の問題だけを表示
        filtered_levels = {level: LEVELS[level]}
        return render_template('solutions.html', levels=filtered_levels, problem_counts=PROBLEM_COUNTS, current_level=level)
    else:
        return render_template('solutions.html', levels=LEVELS, problem_counts=PROBLEM_COUNTS)

@app.route('/api/problem', methods=['GET'])
def get_problem():
    level = request.args.get('level', 'beginner')
    if level not in LEVELS:
        level = 'beginner'
    
    session_id = request.args.get('session_id', 'default')
    question_count = int(request.args.get('question_count', 0))
    
    # セッションIDがまだ辞書にない場合は初期化
    if session_id not in used_problems:
        used_problems[session_id] = []
    
    # 問題数が5問に達した場合はゲーム終了を示す
    if question_count >= 5:
        return jsonify({
            'game_completed': True,
            'message': 'おめでとうございます！全ての問題をクリアしました！'
        })
    
    # 使用可能な問題のリストを作成（まだ使用されていない問題）
    available_problems = [p for i, p in enumerate(LEVELS[level]) if i not in used_problems[session_id]]
    
    # 使用可能な問題がない場合は全ての問題をリセット
    if not available_problems:
        used_problems[session_id] = []
        available_problems = LEVELS[level]
    
    # ランダムに問題を選択
    problem = random.choice(available_problems)
    problem_index = LEVELS[level].index(problem)
    
    # 使用済み問題リストに追加
    used_problems[session_id].append(problem_index)
    
    # パターン自体は送信せず、説明と例だけを送信
    return jsonify({
        'description': problem['description'],
        'examples': problem['examples'],
        'non_examples': problem['non_examples'],
        'hint1': problem['hint1'],
        'hint2': problem['hint2'],
        'problem_index': problem_index,  # 問題のインデックスを返す
        'question_count': question_count + 1  # 問題カウントをインクリメント
    })

@app.route('/api/check', methods=['POST'])
def check_answer():
    data = request.get_json()
    user_pattern = data.get('pattern', '')
    level = data.get('level', 'beginner')
    problem_index = data.get('problem_index', 0)
    attempts = data.get('attempts', 0)
    lives = data.get('lives', 3)
    question_count = data.get('question_count', 1)
    
    if level not in LEVELS or problem_index >= len(LEVELS[level]):
        return jsonify({'error': '無効なレベルまたは問題インデックス'}), 400
    
    problem = LEVELS[level][problem_index]
    expected_pattern = problem['pattern']
    examples = problem['examples']
    non_examples = problem['non_examples']
    
    # ユーザーの正規表現が有効かチェック
    try:
        user_regex = re.compile(user_pattern)
    except re.error:
        return jsonify({'valid': False, 'message': '無効な正規表現です'})
    
    # 全ての例にマッチするかチェック
    all_examples_match = all(re.fullmatch(user_pattern, ex) for ex in examples)
    # 非例にマッチしないかチェック
    no_non_examples_match = all(not re.fullmatch(user_pattern, nex) for nex in non_examples)
    
    if all_examples_match and no_non_examples_match:
        # 5問目が正解の場合はゲーム完了フラグを設定
        game_completed = question_count >= 5
        
        return jsonify({
            'valid': True, 
            'message': '正解です！', 
            'expected_pattern': expected_pattern,
            'game_completed': game_completed,
            'question_count': question_count
        })
    else:
        # 不正解の場合、試行回数に応じたヒントを提供
        hint = None
        if attempts == 1:
            hint = problem['hint1']
        elif attempts >= 2:
            hint = problem['hint2']
        
        # 最後のライフの場合は正解も表示
        show_answer = lives <= 1
        
        return jsonify({
            'valid': False, 
            'message': '不正解です。もう一度試してください。',
            'hint': hint,
            'expected_pattern': expected_pattern if show_answer else None,
            'match_results': {
                'examples': [bool(re.fullmatch(user_pattern, ex)) for ex in examples],
                'non_examples': [bool(re.fullmatch(user_pattern, nex)) for nex in non_examples]
            }
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')