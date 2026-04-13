import os
import glob

# Files to fix
problematic_files = [
    "AutomationStep.tsx", "DebtsStep.tsx", "ExpensesStep.tsx", 
    "FireGoalStep.tsx", "GoalsStep.tsx", "InvestmentsStep.tsx", 
    "StrategyStep.tsx", "SummaryStep.tsx"
]
steps_dir = "d:/meu-contador/frontend/src/components/onboarding/steps"

for filename in problematic_files:
    filepath = os.path.join(steps_dir, filename)
    if not os.path.exists(filepath): continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We will just replace the function signature block. Since the block can span multiple lines, 
    # we can use a regex to find `export ... { ... } : xxxProps)` or whatever.
    import re
    # Match `export function StepName` or `export const StepName =` 
    # followed by `({ ... }: StepProps) {` or similar
    
    # regex pattern: match export (function|const) Name[ =(]*\{[^}]+}(?:\s*:\s*[A-Za-z]+Props)?\s*\)?[ =>]*{
    pattern = r'(export\s+(?:function|const)\s+([A-Za-z]+)[ =\(]*\{)([^}]+)\}(\s*:\s*[A-Za-z]+Props\s*\)?[ =>]*\{)'
    
    match = re.search(pattern, content)
    if match:
        step_name = match.group(2)
        props_content = match.group(3)
        
        # fix props content (onChange -> handleProfileChange: onChange)
        props_clean = [p.strip() for p in props_content.split(',')]
        new_props = []
        for p in props_clean:
            if not p: continue
            if p == 'onChange': new_props.append('handleProfileChange: onChange')
            else: new_props.append(p)
            
        use_statement = '  const { ' + ', '.join(new_props) + ' } = useOnboarding();\n'
        
        replacement = f'export function {step_name}() {{\n{use_statement}'
        if 'const ' in match.group(1):
            replacement = f'export const {step_name} = () => {{\n{use_statement}'
            
        content = re.sub(pattern, replacement, content)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {filename}")
    else:
        print(f"Regex didn't match for {filename}")
