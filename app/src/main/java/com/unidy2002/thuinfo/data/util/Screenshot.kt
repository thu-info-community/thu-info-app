package com.unidy2002.thuinfo.data.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Environment.DIRECTORY_PICTURES
import android.provider.MediaStore
import android.view.View
import java.io.File
import java.io.FileOutputStream


/**
 * An extension of class <code>View</code> that converts a view to a bitmap.
 */
fun View.toBitmap(): Bitmap =
    Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).apply {
        layout(0, 0, width, height)
        draw(Canvas(this).apply { drawColor(Color.WHITE) })
    }

/**
 * An extension of class <code>Bitmap</code> that saves a bitmap to gallery, in png.
 *
 * @param context   the context controlling the process
 * @param filename  the target filename, without suffix (e.g. <code>.png</code>)
 *
 */
fun Bitmap.save(context: Context, filename: String) {
    val filePath = (context.getExternalFilesDir(DIRECTORY_PICTURES)?.absolutePath
        ?: throw Exception("Shared storage is not currently available.")) +
            "/" + filename + System.currentTimeMillis() + Math.random() + ".png"
    FileOutputStream(File(filePath)).run {
        compress(Bitmap.CompressFormat.PNG, 100, this)
        close()
    }
    MediaStore.Images.Media.insertImage(
        context.contentResolver,
        filePath,
        "$filename.png",
        "THUInfoScreenshot"
    )
    File(filePath).delete()
}