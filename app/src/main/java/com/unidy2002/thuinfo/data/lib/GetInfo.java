package com.unidy2002.thuinfo.data.lib;

import android.os.AsyncTask;
import android.util.Log;
import com.unidy2002.thuinfo.data.model.LoggedInUser;
import com.unidy2002.thuinfo.data.model.Calender;
import org.jetbrains.annotations.NotNull;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Scanner;

public class GetInfo {

    final static Object lock = new Object();
    static String cookieReceiver;
    static HttpURLConnection connectionReceiver;
    static InputStream inputStreamReceiver;

    private static InputStream setConnection(HttpURLConnection connection, String host, String referer, String cookie) throws IOException {
        return setConnection(connection, host, referer, cookie, null);
    }

    private static InputStream setConnection(HttpURLConnection connection, String host, String referer, String cookie, String post) throws IOException {
        final String userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36";
        connection.setRequestProperty("User-Agent", userAgent);
        connection.setRequestProperty("Host", host);
        connection.setRequestProperty("Referer", referer);
        connection.setRequestProperty("Cookie", cookie);
        connection.setDoInput(true);
        if (post == null) {
            connection.setRequestMethod("GET");
            connection.connect();
        } else {
            connection.setDoOutput(true);
            connection.setRequestMethod("POST");
            connection.connect();
            OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream(), StandardCharsets.UTF_8);
            out.write(post);
            out.flush();
            out.close();
        }
        return connection.getInputStream();
    }

    private static void getLock() {
        try {
            synchronized (lock) {
                lock.wait();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static class Connect extends AsyncTask<String, Void, HttpURLConnection> {

        @Override
        protected void onPreExecute() {
        }

        @Override
        protected HttpURLConnection doInBackground(String... params) {
            try {
                final String userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36";
                HttpURLConnection connection = (HttpURLConnection) (new URL(params[0])).openConnection();
                connection.setRequestProperty("User-Agent", userAgent);
                connection.setRequestProperty("Host", params[1]);
                if (params[2] != null) connection.setRequestProperty("Referer", params[2]);
                connection.setRequestProperty("Cookie", params[3]);
                connection.setDoInput(true);
                if (params.length == 4) {
                    connection.setRequestMethod("GET");
                    connection.connect();
                } else {
                    connection.setDoOutput(true);
                    connection.setRequestMethod("POST");
                    connection.connect();
                    OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream(), StandardCharsets.UTF_8);
                    out.write(params[4]);
                    out.flush();
                    out.close();
                }
                connectionReceiver = connection;
                List<String> cookieList = connection.getHeaderFields().get("Set-Cookie");
                if (cookieList == null) {
                    cookieReceiver = null;
                } else {
                    cookieReceiver = cookieList.toString();
                    cookieReceiver = cookieReceiver.substring(1, cookieReceiver.length() - 1);
                }
                inputStreamReceiver = connection.getInputStream();
                synchronized (lock) {
                    lock.notify();
                }
                return connection;
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        }

        @Override
        protected void onPostExecute(HttpURLConnection connection) {
        }
    }

    static public void login(@NotNull final LoggedInUser loggedInUser, String password) throws IOException {

        loggedInUser.displayName = "";

        // Login to tsinghua info
        new Connect().execute("https://info.tsinghua.edu.cn/Login", "info.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/index.jsp",
                "", "redirect=NO&userName=" + loggedInUser.getUserId() + "&password=" + password + "&x=0&y=0");
        getLock();
        int temp = cookieReceiver.indexOf("UPORTAL");
        loggedInUser.loginCookie = cookieReceiver.substring(temp, cookieReceiver.indexOf(";", temp));
        inputStreamReceiver.close();
        //loggedInUser.loginCookie = "UPORTALINFONEW=confuseconfuseconfuse";
        Log.d("MSG", "LOGIN COOKIE: " + loggedInUser.loginCookie);

        // Get zhjw session id
        new Connect().execute("http://zhjw.cic.tsinghua.edu.cn/servlet/InvalidateSession", "zhjw.cic.tsinghua.edu.cn",
                "http://info.tsinghua.edu.cn/", "");
        getLock();
        loggedInUser.zhjwSessionId = cookieReceiver;
        inputStreamReceiver.close();
        //loggedInUser.zhjwSessionId = "JSESSIONID=confuseconfuseconfuse";
        Log.d("MSG", "ZHJW SESSION: " + loggedInUser.zhjwSessionId);

        // Get the tickets
        new Connect().execute("http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP?uP_sparam=focusedTabID&focusedTabID=2&uP_sparam=mode&mode=view&_meta_focusedId=2",
                "info.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/login_choice.jsp", loggedInUser.loginCookie);
        getLock();
        final BufferedReader reader = new BufferedReader(new InputStreamReader(inputStreamReceiver, StandardCharsets.UTF_8));

        class getTickets implements Runnable {
            @Override
            public void run() {
                try {
                    String readLine;
                    while ((readLine = reader.readLine()) != null) {
                        if (readLine.contains("a name=\"9-824\"")) {
                            loggedInUser.eCardTicket = readLine.substring(readLine.indexOf("src") + 5, readLine.indexOf("\" id=\"9-824")).replace("amp;", "");
                            Log.d("ECARD TICKET", loggedInUser.eCardTicket);
                        } else if (readLine.contains("a name=\"9-792\"")) {
                            loggedInUser.calenderTicket = readLine.substring(readLine.indexOf("src") + 5, readLine.indexOf("\" id=\"9-792")).replace("amp;", "");
                            Log.d("CALEN TICKET", loggedInUser.calenderTicket);
                        }
                    }
                } catch (Exception e) {
                    loggedInUser.eCardTicket = "";
                    loggedInUser.calenderTicket = "";
                    e.printStackTrace();
                } finally {
                    try {
                        inputStreamReceiver.close();
                        reader.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                // Link user with zhjw
                if (!loggedInUser.calenderTicket.equals("")) {
                    new Connect().execute(loggedInUser.calenderTicket, "zhjw.cic.tsinghua.edu.cn",
                            null, loggedInUser.zhjwSessionId);
                    getLock();

                    // Get calender
                    new Connect().execute("http://zhjw.cic.tsinghua.edu.cn/jxmh_out.do?m=bks_jxrl_all&p_start_date=20190901&p_end_date=20200131&jsoncallback=m",
                            "zhjw.cic.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP",
                            loggedInUser.zhjwSessionId);
                    getLock();

                    try {
                        BufferedReader calenderReader = new BufferedReader(new InputStreamReader(inputStreamReceiver, StandardCharsets.UTF_8));
                        StringBuilder stringBuilder = new StringBuilder();
                        String readLine;
                        while ((readLine = calenderReader.readLine()) != null)
                            stringBuilder.append(readLine);
                        String result = stringBuilder.substring(stringBuilder.indexOf("(") + 1, stringBuilder.lastIndexOf(")"));
                        inputStreamReceiver.close();
                        calenderReader.close();
                        loggedInUser.calender = new Calender(result);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }

        new Thread(new getTickets()).start();

    }

    public static void testPost(String userName, String password) throws IOException {

        //Writer infoLog = new FileWriter(new File("D:\\infoLog.txt"));

        /* Login to tsinghua info */
        HttpURLConnection login = (HttpURLConnection) (new URL("https://info.tsinghua.edu.cn/Login")).openConnection();
        setConnection(login, "info.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/index.jsp",
                "", "redirect=NO&userName=" + userName + "&password=" + password + "&x=0&y=0").close();
        String loginCookie = login.getHeaderFields().get("Set-Cookie").toString();
        loginCookie = loginCookie.substring(1, loginCookie.length() - 1);
        //infoLog.write("LOGIN COOKIE: " + loginCookie + "\n");


        /* Get zhjw session id */
        HttpURLConnection zhjwInit = (HttpURLConnection) (new URL("http://zhjw.cic.tsinghua.edu.cn/servlet/InvalidateSession")).openConnection();
        setConnection(zhjwInit, "zhjw.cic.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/", "").close();
        String zhjwSessionId = zhjwInit.getHeaderField("Set-Cookie");
        //infoLog.write("ZHJW SESSION: " + zhjwSessionId + "\n");

        /* Get the tickets */
        InputStream infoHome = setConnection((HttpURLConnection) (new URL("http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP")).openConnection(),
                "info.tsinghua.edu.cn", "http://info.tsinghua.edu.cn/login_choice.jsp", loginCookie);
        BufferedReader reader = new BufferedReader(new InputStreamReader(infoHome, StandardCharsets.UTF_8));
        String readLine, eCardTicket = null, calenderTicket = null;
        while ((readLine = reader.readLine()) != null) {
            if (readLine.contains("a name=\"9-824\"")) {
                eCardTicket = readLine.substring(readLine.indexOf("src") + 5, readLine.indexOf("\" id=\"9-824")).replace("amp;", "");
                //infoLog.write("ECARD TICKET: " + eCardTicket + "\n");
            } else if (readLine.contains("a name=\"9-792\"")) {
                calenderTicket = readLine.substring(readLine.indexOf("src") + 5, readLine.indexOf("\" id=\"9-792")).replace("amp;", "");
                //infoLog.write("CALEN TICKET: " + calenderTicket + "\n");
            }
        }
        infoHome.close();
        reader.close();

        /* Get Edu Calender */
        if (calenderTicket != null) {
            HttpURLConnection calenderConnection = (HttpURLConnection) (new URL(calenderTicket)).openConnection();
            InputStream calenderData = setConnection(calenderConnection, "http://zhjw.cic.tsinghua.edu.cn",
                    "http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP", zhjwSessionId);
            reader = new BufferedReader(new InputStreamReader(calenderData, "GBK"));
            String line;
            System.out.println("\n----------------");
            boolean mute = false;
            while ((line = reader.readLine()) != null) {
                if (line.contains("table id=\"grrlzdTable\""))
                    mute = true;
                if (!mute) {
                    if (line.contains("<div class=\"day\">")) {
                        System.out.println();
                        line = reader.readLine();
                        System.out.println(removeBlank(line.replace("&nbsp;", "")));
                    } else if (line.contains("<td class=\"rili")) {
                        line = reader.readLine();
                        System.out.println(removeBlank(line.replace("&nbsp;", "")));
                    }
                } else {
                    if (line.contains("</table>"))
                        mute = false;
                }
            }
            calenderData.close();
            reader.close();
        }


        /* Get ecard data */
        if (eCardTicket != null) {

            /* Get ecard cookie */
            HttpURLConnection eCardConnection = (HttpURLConnection) (new URL(eCardTicket)).openConnection();
            InputStream eCardData = setConnection(eCardConnection, "ecard.tsinghua.edu.cn",
                    "http://info.tsinghua.edu.cn/render.userLayoutRootNode.uP", "");
            String eCardCookie = eCardConnection.getHeaderFields().get("Set-Cookie").toString();
            eCardCookie = eCardCookie.substring(1, eCardCookie.length() - 1);
            eCardCookie = eCardCookie.replace(" path=/", "").replace(",", "");
            //infoLog.write("ECARD COOKIE: " + eCardCookie + "\n");

            /* Get useful data */
            reader = new BufferedReader(new InputStreamReader(eCardData, StandardCharsets.UTF_8));
            boolean usefulData = false;
            String line;
            System.out.println("\n----------------");
            while ((line = reader.readLine()) != null) {
                if (line.contains("table cellspacing"))
                    usefulData = true;
                if (usefulData) {
                    if (line.contains("<td"))
                        System.out.println(line.substring(line.indexOf("black") + 7, line.indexOf("</div>")));
                    else if (line.contains("</tr>"))
                        System.out.println();
                }
                if (line.contains("</table>"))
                    usefulData = false;
            }
            eCardData.close();
            reader.close();

            /* Download EXCEL file */
            System.out.println("Need an EXCEL file? (Y/N)");
            char userResponse;
            do {
                userResponse = (char) System.in.read();
                if (userResponse != 'Y' && userResponse != 'N') {
                    System.out.println("Invalid input, please retry...");
                }
            } while (userResponse != 'Y' && userResponse != 'N');
            if (userResponse == 'Y') {
                System.out.println("Please enter filename (without .xls):");
                Scanner scanner = new Scanner(System.in);
                String filename = scanner.next();
                filename = "D:\\" + filename + ".xls";
                System.out.println("File downloading to " + filename);
                InputStream eCardDownload = setConnection((HttpURLConnection) (new URL("http://ecard.tsinghua.edu.cn/user/ExDetailsDown.do")).openConnection(),
                        "ecard.tsinghua.edu.cn", eCardTicket, eCardCookie);
                writeToBinFile(filename, eCardDownload);
                eCardDownload.close();
            }
        }

        //infoLog.close();
    }


    private static String removeBlank(String line) {
        char[] buffer = line.toCharArray();
        for (int pos = 0; pos < line.length(); pos++) {
            if (buffer[pos] != ' ' && buffer[pos] != '\t') {
                return line.substring(pos);
            }
        }
        return null;
    }

    private static void writeToBinFile(String filename, InputStream inputStream) throws IOException {
        final int cache = 1000 * 1024;
        byte[] buffer = new byte[cache];
        int ch, pos = 0;
        while ((ch = inputStream.read()) != -1)
            buffer[pos++] = (byte) ch;
        FileOutputStream outputStream = new FileOutputStream(filename);
        outputStream.write(buffer);
        outputStream.close();
    }

}
