import re
import random
import time

def generate_enemy_string():
    # ランダムな敵の文字列を生成して返す「関数」。
    length = random.randint(5, 15)
    
    # 文字列を作るための材料
    characters = "abcdefghijklmnopqrstuvwxyz0123456789" 
    
    # charactersの中からランダムに1文字を選び、それをlength回繰り返してリストに入れる
    enemy_list = [random.choice(characters) for _ in range(length)]
    
    # リストに入っている文字を全部つなげて一つの文字列にする
    enemy_string = "".join(enemy_list)

    # 作った敵の文字列を返す
    return enemy_string

# このスクリプトが直接実行された時だけ以下の処理を行う
if __name__ == "__main__":
    # 関数を呼び出して敵を生成
    test_enemy = generate_enemy_string()
    # 生成された敵を標示
    print(f"生成された敵: {test_enemy}")
