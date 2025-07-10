import pandas as pd
import sys
import os
import json

ACADEMIC_MAJORS = [
    "仪器科学与技术(080400)", "信息与通信工程(081000)", 
    "控制科学与工程(081100)", "电子科学与技术(080900)",
    "电气工程(080800)", "网络空间安全(083900)",
    "计算机科学与技术(081200)", "集成电路科学与工程(140100)"
]
PROFESSIONAL_MAJORS = [
    "电气工程(085801)", "电子信息(085400)"
]

if len(sys.argv) < 3:
    print("用法: python fulltime_master.py <excel文件路径> <输出文件路径>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

try:
    df = pd.read_excel(input_file, dtype={'工号': str})
except Exception as e:
    print(f"读取Excel失败: {e}")
    sys.exit(1)

# 只保留需要的列
columns_needed = [
    "申请年度", "申请批次", "姓名", "工号", "导师类别", "是否首次", "院系", "招生专业", "分委会", "学部学位委会"
]
df = df[[col for col in columns_needed if col in df.columns]]

# 去除工号、姓名为空的数据
df = df.dropna(subset=["工号", "姓名"])

# 合并逻辑
result_rows = []
for (name, job_id), group in df.groupby(["姓名", "工号"]):
    row = {
        "申请年度": group.iloc[0]["申请年度"],
        "申请批次": group.iloc[0]["申请批次"],
        "姓名": name,
        "工号": job_id,
        "导师类别": group.iloc[0]["导师类别"],
        "是否首次": group.iloc[0]["是否首次"]
    }
    # 学术型
    academic = group[group["招生专业"].isin(ACADEMIC_MAJORS)]
    if not academic.empty:
        row["学术型招生专业"] = academic.iloc[0]["招生专业"]
        row["学术型招生院系"] = ";".join(sorted(set(academic["院系"].astype(str))))
        row["学术型分委会"] = ";".join(sorted(set(academic["分委会"].astype(str))))
    else:
        row["学术型招生专业"] = ""
        row["学术型招生院系"] = ""
        row["学术型分委会"] = ""
    # 专业型
    professional = group[group["招生专业"].isin(PROFESSIONAL_MAJORS)]
    if not professional.empty:
        row["专业型招生专业"] = professional.iloc[0]["招生专业"]
        row["专业型招生院系"] = ";".join(sorted(set(professional["院系"].astype(str))))
        row["专业型分委会"] = ";".join(sorted(set(professional["分委会"].astype(str))))
    else:
        row["专业型招生专业"] = ""
        row["专业型招生院系"] = ""
        row["专业型分委会"] = ""
    result_rows.append(row)

output_columns = [
    "申请年度", "申请批次", "姓名", "工号", "导师类别", "是否首次",
    "学术型招生专业", "学术型招生院系", "学术型分委会",
    "专业型招生专业", "专业型招生院系", "专业型分委会"
]

result_df = pd.DataFrame(result_rows, columns=output_columns)
result_df.to_excel(output_file, index=False)

stats = {
    "raw_count": len(df),
    "normalized_count": len(result_df)
}
print(json.dumps(stats, ensure_ascii=False)) 