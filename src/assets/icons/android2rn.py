from sys import argv

with open(argv[1]) as f:
    txt = ''.join(f.readlines())
    beg = txt.find('>') + 1
    end = txt.rfind('</')
    txt = txt[beg:end]
    txt = txt.replace('<path', '<Path')
    txt = txt.replace('android:pathData', 'd')
    txt = txt.replace('android:fillColor="@color/iconTheme', 'fill={colors.')
    txt = txt.replace('Dark"', 'dark}')
    # txt = txt.replace('"/>', '}/>')
    with open('out_' + argv[1], 'w') as g:
        g.write(txt)
