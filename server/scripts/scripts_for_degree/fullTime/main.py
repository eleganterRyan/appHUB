import pandas as pd
import sys
import os
import json

# 学术型与专业型招生专业
ACADEMIC_MAJORS = [
    "仪器科学与技术(080400)", "信息与通信工程(081000)", 
    "控制科学与工程(081100)", "电子科学与技术(080900)",
    "电气工程(080800)", "网络空间安全(083900)",
    "计算机科学与技术(081200)", "集成电路科学与工程(140100)"
]
PROFESSIONAL_MAJORS = [
    "电气工程(085801)", "电子信息(085400)"
]

# 入口参数：excel文件路径、输出文件路径
if len(sys.argv) < 3:
    print("用法: python main.py <excel文件路径> <输出文件路径>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

# 读取数据
try:
    df = pd.read_excel(input_file)
except Exception as e:
    print(f"读取Excel失败: {e}")
    sys.exit(1)

# 目标列
output_columns = [
    "申请年度", "申请批次", "姓名", "工号", "导师类别", "是否首次",
    "招生专业1", "招生专业1分委会", "招生专业1招生院系",
    "招生专业2", "招生专业2分委会", "招生专业2招生院系",
    "招生专业3", "招生专业3分委会", "招生专业3招生院系",
    "分委会审核状态", "学部学位委会",
    "是否超龄"
]

# 预处理：去除空行
df = df.dropna(subset=["姓名", "工号"])

# 分组处理
result_rows = []
for (name, job_id), group in df.groupby(["姓名", "工号"]):
    row = {
        "申请年度": group.iloc[0]["申请年度"],
        "申请批次": group.iloc[0]["申请批次"],
        "姓名": name,
        "工号": job_id,
        "导师类别": group.iloc[0]["导师类别"],
        "是否首次": group.iloc[0]["是否首次"],
        "分委会审核状态": group.iloc[0]["分委会审核状态"],
        "学部学位委会": group.iloc[0]["学部学位委会"],
        "是否超龄": group.iloc[0].get("是否超龄", "")
    }
    # 统计招生专业
    academic = []
    professional = []
    for _, g in group.iterrows():
        major = str(g["招生专业"]).strip()
        sub_committee = str(g["分委会"]).strip() if "分委会" in g else ""
        department = str(g["院系"]).strip() if "院系" in g else ""
        if major in ACADEMIC_MAJORS:
            academic.append((major, sub_committee, department))
        elif major in PROFESSIONAL_MAJORS:
            professional.append((major, sub_committee, department))
    # 合并院系（学术型：按专业+分委会合并，专业型：所有分委会和院系分别合并）
    def merge_departments_academic(items):
        majors = {}
        for m, c, d in items:
            key = (m, c)
            if key not in majors:
                majors[key] = set()
            majors[key].add(d)
        result = []
        for (m, c), departments in majors.items():
            result.append((
                m,
                c,
                ";".join(sorted(departments))
            ))
        return result
    def merge_departments_professional(items):
        majors = {}
        for m, c, d in items:
            if m not in majors:
                majors[m] = {"committees": set(), "departments": set()}
            majors[m]["committees"].add(c)
            majors[m]["departments"].add(d)
        result = []
        for m, info in majors.items():
            result.append((
                m,
                ",".join(sorted(info["committees"])),
                ";".join(sorted(info["departments"]))
            ))
        return result[:1]  # 只保留1个专业型
    academic_merged = merge_departments_academic(academic)[:2]
    professional_merged = merge_departments_professional(professional)
    # 填充到输出行
    for i in range(2):
        if i < len(academic_merged):
            row[f"招生专业{i+1}"] = academic_merged[i][0]
            row[f"招生专业{i+1}分委会"] = academic_merged[i][1]
            row[f"招生专业{i+1}招生院系"] = academic_merged[i][2]
        else:
            row[f"招生专业{i+1}"] = ""
            row[f"招生专业{i+1}分委会"] = ""
            row[f"招生专业{i+1}招生院系"] = ""
    for i in range(1):
        if i < len(professional_merged):
            row[f"招生专业{3}"] = professional_merged[i][0]
            row[f"招生专业{3}分委会"] = professional_merged[i][1]
            row[f"招生专业{3}招生院系"] = professional_merged[i][2]
        else:
            row[f"招生专业{3}"] = ""
            row[f"招生专业{3}分委会"] = ""
            row[f"招生专业{3}招生院系"] = ""
    result_rows.append(row)

# 输出结果
result_df = pd.DataFrame(result_rows, columns=output_columns)
result_df.to_excel(output_file, index=False)
print(f"分析完成，结果已保存到: {output_file}")

# 新增：输出统计信息，便于后端获取
stats = {
    "raw_count": len(df),
    "normalized_count": len(result_df)
}
print(json.dumps(stats, ensure_ascii=False)) 