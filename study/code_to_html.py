html_code:str = "";

file = open("./code.txt","r");
lines = file.readlines();
file.close();

html_code += "<pre>"

for i in range(len(lines)):
    line = lines[i];
    line = line.replace('&' ,"&amp;");
    line = line.replace('<',"&lt;");
    line = line.replace('>' ,"&gt;");
    line = line.replace(' ',"&nbsp;");
    line = line.replace('"' ,"&quot;");
    line = line.replace('©️' ,"&copy;");
    line = line.replace("'" ,"&apos;");
    # 行末は改行コードなのでそれを省く
    r:int = len(line);
    if(line[-1] == "\n"):r-=1;
    html_code += line[0:r];
    if(i+1 != len(lines)) : html_code += "<br>";
    

html_code += "</pre>";

file = open("./code.txt","w");
file.write(html_code);
file.flush();
file.close();