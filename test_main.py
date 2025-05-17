# Python標準のユニットテストフレームワーク
import unittest

# テスト対象の関数をインポート
from regex_shooter import generate_enemy_string

class TestGenerateEnemyString(unittest.TestCase):
    # generate_enemy_string 関数のテストクラス
    def test_string_returned(self):
        # 関数が文字列を返すことをテストします。
        enemy = generate_enemy_string()
        self.assertTrue(isinstance(enemy, str), "生成された敵は文字列である"))

    def test_string_length(self):
        # 生成される文字列の長さは5文字以上15文字以内
        for _ in range(100): # 100回テストして、範囲外が出ないか確認
            enemy = generate_enemy_string()
            self.assertTrue(5 <= len(enemy) <= 15, f"文字列の長さが範囲外です: {len(enemy)} (文字列: '{enemy}')")

    def test_not_empty_string(self):
        # 生成される文字列が空でないことをテストします。
        enemy = generate_enemy_string()
        self.assertTrue(len(enemy) > 0, "生成された文字列は空であってはなりません。")
