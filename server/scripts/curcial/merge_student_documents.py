#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学生论文材料合并脚本
功能：
1. 读取Excel中的学生信息
2. 为每个学生更新封面信息
3. 将Word文档转换为PDF
4. 按文件名数字顺序合并PDF
5. 创建带导航的最终PDF
"""

import os
import re
import pandas as pd
import fitz  # PyMuPDF
from docx import Document
import subprocess
import sys
from pathlib import Path
import json

# 设置环境变量确保UTF-8编码
os.environ['PYTHONIOENCODING'] = 'utf-8'

class StudentDocumentMerger:
    def __init__(self, student_folders, output_dir, base_dir=None, excel_file=None):
        # base_dir为curcial目录
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).parent
        self.student_folders = [Path(f) for f in student_folders]
        if excel_file:
            self.excel_file = Path(excel_file)
        else:
            self.excel_file = self.base_dir / "学号&姓名&专业.xlsx"
        self.cover_template = self.base_dir / "通用封面.docx"
        self.output_dir = Path(output_dir)
        self.student_info = self.load_student_info()
        self.output_dir.mkdir(exist_ok=True, parents=True)

    def load_student_info(self):
        try:
            df = pd.read_excel(self.excel_file, dtype={'学号': str})
            print(f"成功读取学生信息，共 {len(df)} 名学生")
            return df.set_index('姓名').to_dict('index')
        except Exception as e:
            print(f"读取Excel文件失败: {e}")
            return {}

    def update_cover_for_student(self, student_name):
        if student_name not in self.student_info:
            print(f"警告: 在Excel中找不到学生 {student_name} 的信息")
            return None
        student_data = self.student_info[student_name]
        student_num = str(student_data['学号'])
        major = student_data['专业']
        try:
            doc = Document(self.cover_template)
            for paragraph in doc.paragraphs:
                full_text = paragraph.text
                if '专业' in full_text or '学号' in full_text or '姓名' in full_text:
                    new_text = full_text
                    new_text = re.sub(r'专业[：:]\s*[\w\s]*', f'专业：{major}', new_text)
                    new_text = re.sub(r'学号[：:]\s*[\w\d]*', f'学号：{student_num}', new_text)
                    new_text = re.sub(r'姓名[：:]\s*[\w\s]*', f'姓名：{student_name}', new_text)
                    if new_text != full_text:
                        paragraph.clear()
                        paragraph.add_run(new_text)
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for paragraph in cell.paragraphs:
                            full_text = paragraph.text
                            if '专业' in full_text or '学号' in full_text or '姓名' in full_text:
                                new_text = full_text
                                new_text = re.sub(r'专业[：:]\s*[\w\s]*', f'专业：{major}', new_text)
                                new_text = re.sub(r'学号[：:]\s*[\w\d]*', f'学号：{student_num}', new_text)
                                new_text = re.sub(r'姓名[：:]\s*[\w\s]*', f'姓名：{student_name}', new_text)
                                if new_text != full_text:
                                    paragraph.clear()
                                    paragraph.add_run(new_text)
            # 确保封面文件名使用正确的UTF-8编码
            cover_filename = f"封面_{student_name}.docx"
            cover_path = self.output_dir / cover_filename
            # 确保路径正确编码
            cover_path = Path(str(cover_path).encode('utf-8').decode('utf-8'))
            doc.save(cover_path)
            print(f"已为 {student_name} 创建个人封面")
            return cover_path
        except Exception as e:
            print(f"更新封面失败 {student_name}: {e}")
            return None

    def word_to_pdf(self, word_file, output_dir):
        try:
            cmd = [
                'soffice', '--headless', '--convert-to', 'pdf',
                '--outdir', str(output_dir), str(word_file)
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode == 0:
                pdf_name = Path(word_file).stem + '.pdf'
                pdf_path = Path(output_dir) / pdf_name
                if pdf_path.exists():
                    print(f"成功转换: {word_file} -> {pdf_name}")
                    return pdf_path
                else:
                    print(f"转换后找不到PDF文件: {pdf_path}")
                    return None
            else:
                print(f"soffice转换失败: {result.stderr}")
                return None
        except subprocess.TimeoutExpired:
            print(f"转换超时: {word_file}")
            return None
        except FileNotFoundError:
            print("未找到soffice命令")
            return None
        except Exception as e:
            print(f"转换出错: {e}")
            return None

    def extract_file_number(self, filename):
        match = re.match(r'^(\d+)', filename)
        return int(match.group(1)) if match else 999
    
    def ensure_utf8_string(self, text):
        """确保字符串是UTF-8编码的"""
        if isinstance(text, bytes):
            try:
                return text.decode('utf-8')
            except UnicodeDecodeError:
                return text.decode('gbk', errors='ignore')
        return str(text)

    def get_student_files(self, student_folder):
        files = []
        for file_path in Path(student_folder).iterdir():
            if file_path.is_file() and not file_path.name.startswith('.'):
                files.append(file_path)
        files.sort(key=lambda x: self.extract_file_number(x.name))
        return files

    def merge_pdfs_with_bookmarks(self, pdf_files, output_path, student_name):
        try:
            merged_doc = fitz.open()
            bookmarks = []
            temp_files = []
            for i, file_path in enumerate(pdf_files):
                current_pdf_path = None
                if file_path.suffix.lower() == '.pdf':
                    current_pdf_path = file_path
                elif file_path.suffix.lower() in ['.doc', '.docx']:
                    temp_pdf_path = self.word_to_pdf(file_path, file_path.parent)
                    if temp_pdf_path and temp_pdf_path.exists():
                        current_pdf_path = temp_pdf_path
                        temp_files.append(temp_pdf_path)
                    else:
                        print(f"跳过文件（转换失败）: {file_path.name}")
                        continue
                if current_pdf_path:
                    try:
                        current_doc = fitz.open(str(current_pdf_path))
                        current_page_count = merged_doc.page_count
                        merged_doc.insert_pdf(current_doc)
                        # 确保书签标题正确处理中文编码
                        bookmark_title = self.ensure_utf8_string(file_path.stem)
                        bookmarks.append([1, bookmark_title, current_page_count + 1])
                        current_doc.close()
                        print(f"已添加: {bookmark_title}")
                    except Exception as e:
                        print(f"处理PDF文件失败 {current_pdf_path}: {e}")
                        continue
            
            # 设置PDF元数据以支持中文
            merged_doc.set_metadata({
                "title": f"{student_name}的论文材料",
                "author": "系统生成",
                "subject": "学生论文材料合并",
                "creator": "StudentDocumentMerger",
                "producer": "PyMuPDF"
            })
            
            # 添加书签目录，确保中文正确显示
            if bookmarks:
                try:
                    # 使用set_toc方法添加书签，确保UTF-8编码
                    merged_doc.set_toc(bookmarks)
                    print(f"成功添加 {len(bookmarks)} 个书签")
                except Exception as e:
                    print(f"添加书签失败: {e}")
                    # 如果set_toc失败，尝试使用底层API添加书签
                    try:
                        # 清空现有书签
                        merged_doc.set_toc([])
                        # 逐个添加书签
                        for level, title, page in bookmarks:
                            # 确保标题是UTF-8字符串
                            utf8_title = self.ensure_utf8_string(title)
                            # 使用底层API添加书签
                            merged_doc.set_toc(merged_doc.get_toc() + [(level, utf8_title, page)])
                        print(f"使用底层API成功添加 {len(bookmarks)} 个书签")
                    except Exception as e2:
                        print(f"底层API添加书签也失败: {e2}")
                        # 最后尝试：直接设置整个目录
                        try:
                            toc = []
                            for level, title, page in bookmarks:
                                utf8_title = self.ensure_utf8_string(title)
                                toc.append((level, utf8_title, page))
                            merged_doc.set_toc(toc)
                            print(f"直接设置目录成功，添加 {len(toc)} 个书签")
                        except Exception as e3:
                            print(f"所有书签添加方法都失败: {e3}")
            
            # 确保输出路径使用正确的编码
            output_path_str = str(output_path)
            merged_doc.save(output_path_str)
            merged_doc.close()
            
            # 清理临时文件
            for temp_file in temp_files:
                try:
                    temp_file.unlink()
                except Exception:
                    pass
            print(f"合并PDF已保存: {output_path}")
            return True
        except Exception as e:
            print(f"合并PDF失败: {e}")
            return False

    def process_student(self, student_folder):
        student_name = Path(student_folder).name
        print(f"\n处理学生: {student_name}")
        cover_path = self.update_cover_for_student(student_name)
        files = self.get_student_files(student_folder)
        if cover_path:
            files = [cover_path] + files
        pdf_files = []
        temp_files_to_delete = []
        # 记录封面docx和封面pdf
        cover_pdf_path = None
        if cover_path:
            # 先转为PDF
            cover_pdf_path = self.word_to_pdf(cover_path, cover_path.parent)
            if cover_pdf_path:
                pdf_files.append(cover_pdf_path)
                temp_files_to_delete.append(cover_pdf_path)
        # 处理其他文件
        for f in files:
            # 跳过封面docx
            if cover_path and f == cover_path:
                continue
            if f.suffix.lower() == '.pdf':
                pdf_files.append(f)
            elif f.suffix.lower() in ['.doc', '.docx']:
                pdf_path = self.word_to_pdf(f, f.parent)
                if pdf_path:
                    pdf_files.append(pdf_path)
                    temp_files_to_delete.append(pdf_path)
        # 确保文件名使用UTF-8编码
        output_pdf = self.output_dir / f"{student_name}.pdf"
        # 确保路径字符串正确编码
        output_pdf = Path(str(output_pdf).encode('utf-8').decode('utf-8'))
        self.merge_pdfs_with_bookmarks(pdf_files, output_pdf, student_name)
        # 删除封面docx
        if cover_path and cover_path.exists():
            try:
                cover_path.unlink()
            except Exception:
                pass
        # 删除所有中间pdf
        for temp_file in temp_files_to_delete:
            if temp_file.exists():
                try:
                    temp_file.unlink()
                except Exception:
                    pass

    def run(self):
        for folder in self.student_folders:
            self.process_student(folder)

def main():
    if len(sys.argv) < 2:
        print("请传入JSON参数，包含student_folders和output_dir")
        sys.exit(1)
    try:
        args = json.loads(sys.argv[1])
        student_folders = args.get('student_folders', [])
        output_dir = args.get('output_dir', './合并后的PDF文件')
        excel_file = args.get('excel_file')
        base_dir = Path(__file__).parent
        merger = StudentDocumentMerger(student_folders, output_dir, base_dir, excel_file=excel_file)
        merger.run()
        print(json.dumps({"success": True}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main() 