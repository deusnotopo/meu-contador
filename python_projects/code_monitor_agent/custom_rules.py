import ast
import os

class CustomRules:
    @staticmethod
    def check_file(file_path):
        issues = []
        ext = os.path.splitext(file_path)[1]
        
        if ext == ".py":
            issues.extend(CustomRules._check_python(file_path))
        elif ext in [".ts", ".tsx"]:
            issues.extend(CustomRules._check_typescript(file_path))
            
        return issues

    @staticmethod
    def _check_python(file_path):
        issues = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read())
            
            # Example rule: check for classes with too many methods
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    methods = [n for n in node.body if isinstance(n, ast.FunctionDef)]
                    if len(methods) > 20:
                        issues.append(f"Class '{node.name}' has {len(methods)} methods (God Class smell)")
        except:
            pass
        return issues

    @staticmethod
    def _check_typescript(file_path):
        issues = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Example rule: check for file length (God Component)
            lines = content.splitlines()
            if len(lines) > 500:
                issues.append(f"File too long ({len(lines)} lines). Consider breaking down into smaller components.")
            
            # Example rule: check for missing Zod imports in services
            if "services" in file_path and "zod" not in content.lower() and "z" not in content:
                issues.append("Service file might be missing Zod validation schemas.")
                
        except:
            pass
        return issues
