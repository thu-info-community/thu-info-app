package com.unidy2002.thuinfo.data.util

import jxl.Workbook.createWorkbook
import jxl.format.Alignment
import jxl.format.Border
import jxl.format.BorderLineStyle
import jxl.format.Colour
import jxl.write.Label
import jxl.write.WritableCellFormat
import jxl.write.WritableFont
import jxl.write.WritableFont.BOLD
import java.io.File

private var titleFormat = WritableCellFormat(WritableFont(WritableFont.ARIAL, 12, BOLD)).apply {
    alignment = Alignment.CENTRE
    setBorder(Border.ALL, BorderLineStyle.THIN)
    setBackground(Colour.GRAY_25)
}

private var contentFormat = WritableCellFormat(WritableFont(WritableFont.ARIAL, 12)).apply {
    alignment = Alignment.CENTRE
    setBorder(Border.ALL, BorderLineStyle.THIN)
}

/**
 * @see <a href="https://www.jianshu.com/p/d3d40a69a9b1" />
 */
fun createExcel(file: File, sheetName: String, colName: List<String>, content: List<List<String>>) {
    with(createWorkbook(file)) {
        with(createSheet(sheetName, 0)) {
            colName.forEachIndexed { col, name ->
                addCell(Label(col, 0, name, titleFormat))
                setColumnView(col, 20)
            }
            (0..content.size).forEach { setRowView(it, 350) }
            content.forEachIndexed { i, row ->
                row.forEachIndexed { j, item ->
                    addCell(Label(j, i + 1, item, contentFormat))
                }
            }
        }
        write()
        close()
    }
}