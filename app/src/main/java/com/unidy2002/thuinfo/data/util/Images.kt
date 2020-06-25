package com.unidy2002.thuinfo.data.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.os.Environment.DIRECTORY_PICTURES
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import com.unidy2002.thuinfo.data.network.Network
import java.io.File
import java.io.FileInputStream
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

/**
 * Given the path of an image, transform it into Base64-encoded value.
 *
 * @param path  the path of the image to be processed
 * @see         <url>https://www.jianshu.com/p/e1aa920584e0</url>
 */
fun imageToBase64(path: String): String {
    var inputStream: FileInputStream? = null
    return try {
        inputStream = FileInputStream(path)
        with(ByteArray(inputStream.available())) {
            inputStream.read(this)
            Base64.encodeToString(this, Base64.NO_CLOSE)
        }
    } catch (e: java.lang.Exception) {
        e.printStackTrace()
        ""
    } finally {
        inputStream?.close()
    }
}

fun Network.getBitmap(url: String): Bitmap = BitmapFactory.decodeStream(connect(url).inputStream)