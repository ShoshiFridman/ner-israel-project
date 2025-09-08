<?php
include_once 'dbq.php';

// הגדרת המקורות והקודים שלהם

/*$sources = [
    'ner_yisrael' => [   // השתמש בשם "ner_yisrael" שמתאים לשדה ב־DB
        'db_field' => 'hefresh_ner_yisrael',
        'prefix' => 'ner_yisrael',
        'institution_code' => '11089018',
        'institution_name' => 'נר ישראל',
        'payment_type' => '01'
    ],
    'beit_yitzchak' => [
        'db_field' => 'hefresh_beit_yitzchak',
        'prefix' => 'beit_yitzchak',
        'institution_code' => '11789013',
        'institution_name' => 'בית יצחק',
        'payment_type' => '01'
    ],
    'gmach_ner_yisrael' => [
        'db_field' => 'hefresh_gmach_ner_yisrael',
        'prefix' => 'gmach_ner_yisrael',
        'institution_code' => '11089018',
        'institution_name' => 'גמח נר ישראל',
        'payment_type' => '01'
    ]
];*/

// ================== פונקציה ליצירת קבצי מס"ב ==================
/*פונקציה מקורית
function create_masav($month, $year){
    global $sources;

    $rows = queryasarray("
        SELECT p.avrech_id, a.חשבון, a.סניף, a.בנק, a.פרטי, a.משפחה, a.תז,
               p.hefresh_ner_yisrael, p.hefresh_beit_yitzchak, p.hefresh_gmach_ner_yisrael
        FROM פעימות p
        JOIN אברכים a ON p.avrech_id = a.אברך_id
    ");

    $today_date = date("dmy"); 
    $today_file = date("Ymd"); 

    $files = [];
    $file_created = [];
    $totals = [];
    $counts = [];

    // יצירת קבצים עבור כל מקור
    foreach($sources as $field => $info){
// בודק אם כבר קיים קובץ כזה, ואם כן – מוסיף מונה רץ
$baseName = "masav_{$info['prefix']}_{$today_file}";
$counter = 1;
$filename = "{$baseName}.txt";
while (file_exists($filename)) {
    $counter++;
    $filename = "{$baseName}_p{$counter}.txt";
}
var_dump(is_writable(__DIR__));

        $files[$field] = fopen($filename, "w");
        $file_created[$field] = false;
        $totals[$field] = 0;
        $counts[$field] = 0;

        // רשומת כותרת
        $header = str_pad('K',1,' ',STR_PAD_RIGHT);
        $header .= str_pad($info['institution_code'],15,' ',STR_PAD_RIGHT);
        $header .= str_pad($info['institution_name'],30,' ',STR_PAD_RIGHT);
        $header .= str_pad('MAS',3,' ',STR_PAD_RIGHT); 
        $header .= str_pad($today_date,6,'0',STR_PAD_LEFT);
        //fwrite($files[$field], $header . "\r\n");

        if(fwrite($files[$field], $header . "\r\n") === false){
            echo "שגיאה בכתיבה לקובץ $filename<br>";
        }
        
    }

    // רשומות תנועה
    foreach($rows as $r){
        foreach($sources as $field => $info){
            /*$hefresh_field = "hefresh_" . $field;
            $amount_to_write = $r[$hefresh_field] ?? 0;*-/
            $amount_to_write = $r[$info['db_field']] ?? 0;

            if($amount_to_write > 0){
                $file_created[$field] = true;
                $counts[$field]++;

                $line = str_pad('1',1,'0',STR_PAD_LEFT); // קוד רשומה
                $line .= str_pad($r['בנק'],3,'0',STR_PAD_LEFT);
                $line .= str_pad($r['סניף'],3,'0',STR_PAD_LEFT);
                $line .= str_pad($r['חשבון'],9,'0',STR_PAD_LEFT);
                $full_name = $r['פרטי'] . ' ' . $r['משפחה'];
                $line .= str_pad(substr($full_name,0,30),30,' ',STR_PAD_RIGHT);
                $line .= str_pad(str_replace('.', '', number_format($amount_to_write,2,'.','')),10,'0',STR_PAD_LEFT);
                $line .= str_pad($today_date,6,'0',STR_PAD_LEFT);
                $line .= str_pad($info['payment_type'],2,'0',STR_PAD_LEFT);
                $line .= str_pad($r['תז'],9,'0',STR_PAD_LEFT);
                fwrite($files[$field], $line . "\r\n");

                $totals[$field] += round($amount_to_write*100);

                // מאפסים את hefresh לאחר כתיבת הרשומה
                //doq("UPDATE פעימות SET {$hefresh_field}=0 WHERE avrech_id=$1", [$r['avrech_id']]);
                doq("UPDATE פעימות SET {$info['db_field']}=0 WHERE avrech_id=$1", [$r['avrech_id']]);

            }
        }
    }

    // רשומת סיכום
    foreach($sources as $field => $info){
        if($file_created[$field]){
            $line = str_pad('5',1,' ',STR_PAD_RIGHT);
            $line .= str_pad($counts[$field],6,'0',STR_PAD_LEFT);
            $line .= str_pad($totals[$field],12,'0',STR_PAD_LEFT);
            fwrite($files[$field], $line . "\r\n");
        }
    }

    // סגירה והוספה להיסטוריה
    foreach($sources as $field => $info){
        /*fclose($files[$field]);
        $filename = "masav_{$info['prefix']}_{$today_file}.txt";
        if(!$file_created[$field]){
            unlink($filename);
        } else {
            doq("INSERT INTO masav_history (file_name, created_at) VALUES ($1, now())", [$filename]);
            echo "קובץ {$info['prefix']} נוצר: $filename<br>";
        }*-/

        fclose($files[$field]);
if(!$file_created[$field]){
    unlink($filename);
} else {
    doq("INSERT INTO masav_history (file_name, created_at) VALUES ($1, now())", [$filename]);
    echo "קובץ {$info['prefix']} נוצר: $filename<br>";
}

    }
}*/
$sources = [
    'ner_yisrael' => [
        'db_field' => 'hefresh_ner_yisrael',
        'prefix' => 'ner_yisrael',
        'institution_code' => '11089018',   // קוד מוסד מלא
        'sending_institution' => '11089',   // קוד שולח
        'institution_name' => 'נר ישראל',
        'transaction_type' => '701'
    ],
    'beit_yitzchak' => [
        'db_field' => 'hefresh_beit_yitzchak',
        'prefix' => 'beit_yitzchak',
        'institution_code' => '11789013',
        'sending_institution' => '11789',
        'institution_name' => 'בית יצחק',
        'transaction_type' => '701'
    ],
    'gmach_ner_yisrael' => [
        'db_field' => 'hefresh_gmach_ner_yisrael',
        'prefix' => 'gmach_ner_yisrael',
        'institution_code' => '11089018',
        'sending_institution' => '27401',
        'institution_name' => 'גמח נר ישראל',
        'transaction_type' => '701'
    ]
];






/*הנורמלית האחרונה שעבדה איכשהו function create_masav($month, $year){
    global $sources;

    $rows = queryasarray("
        SELECT p.avrech_id, a.חשבון, a.סניף, a.בנק, a.פרטי, a.משפחה, a.תז,
               p.hefresh_ner_yisrael, p.hefresh_beit_yitzchak, p.hefresh_gmach_ner_yisrael
        FROM פעימות p
        JOIN אברכים a ON p.avrech_id = a.אברך_id
    ");

    $today_date = date("ymd");   // YYMMDD
    $today_file = date("Ymd");   // YYYYMMDD לשם הקובץ

    $files = [];
    $totals = [];
    $counts = [];

    foreach($sources as $field => $info){
        $has_value = false;
        foreach($rows as $r){
            $value = isset($r[$info['db_field']]) ? floatval($r[$info['db_field']]) : 0;
            if($value > 0){
                $has_value = true;
                break;
            }
        }

        if($has_value){
            $baseName = "masav_{$info['prefix']}_{$today_file}";
            $counter = 1;
            $filename = "{$baseName}.001";
            while(file_exists($filename)){
                $counter++;
                $filename = "{$baseName}_p{$counter}.001";
            }

            // ❗ פתיחת הקובץ ב־wb (בינארי) ולא w
            $files[$field] = fopen($filename, "wb");
            $totals[$field] = 0;
            $counts[$field] = 0;

            // כתיבת רשומת כותרת
            $header = 'K';
            $header .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT);
            $header .= '00';
            $header .= $today_date;
            $header .= '0';
            $header .= '001';
            $header .= '0';
            $header .= $today_date;
            $header .= str_pad($info['sending_institution'],5,'0',STR_PAD_LEFT);
            $header .= str_repeat('0',6);
            $header .= str_pad(substr($info['institution_name'],0,30),30,' ',STR_PAD_RIGHT);
            $header .= str_repeat(' ',56);
            $header .= 'KOT';
            $header .= "\r\n";
            fwrite($files[$field], iconv("UTF-8", "Windows-1255//TRANSLIT", $header));
        
        }
    }

    foreach($rows as $r){
        foreach($sources as $field => $info){
            if(!isset($files[$field])) continue;

            $value = isset($r[$info['db_field']]) ? floatval($r[$info['db_field']]) : 0;
            if($value > 0){
                $line = '1';
                $line .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT);
                $line .= '00';
                $line .= str_repeat('0',6);
                $line .= str_pad($r['בנק'],2,'0',STR_PAD_LEFT);
                $line .= str_pad($r['סניף'],3,'0',STR_PAD_LEFT);
                $line .= str_repeat('0',4);
                $line .= str_pad($r['חשבון'],9,'0',STR_PAD_LEFT);
                $line .= '0';
                $line .= str_pad($r['תז'],9,'0',STR_PAD_LEFT);
                $full_name = $r['פרטי'] . ' ' . $r['משפחה'];
                $line .= str_pad(strrev(substr($full_name,0,16)),16,' ',STR_PAD_RIGHT);
                $line .= str_pad(number_format($value*100,0,'',''),13,'0',STR_PAD_LEFT);
                $line .= str_pad($r['avrech_id'],20,'0',STR_PAD_LEFT);
                $line .= '00000000';
                $line .= '000';
                $line .= str_repeat('0',18);
                $line .= str_repeat(' ',2);
                $line .= "\r\n";
                echo $field . " -> " . strlen($line) . "<br>";
                if (strlen($line) !== 130) { // 128 + CRLF
                    echo "⚠️ שורה לא באורך תקני: ".strlen($line)."<br>";
                }
                
                fwrite($files[$field], iconv("UTF-8", "Windows-1255//IGNORE", $line));
            
          

                $totals[$field] += round($value*100);
                $counts[$field]++;
            }
        }
    }

   
    foreach($files as $field => $fh){
        $info = $sources[$field];
    
        // שורת סיכום - Type 5
        $line = '5'; 
        $line .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT); // 1–8
        $line .= '00'; // 9–10
        $line .= $today_date; // 11–16 YYMMDD
        $line .= '0'; // 17
        $line .= '001'; // 18–20
    
        // ריפוד לפני הסכום כדי שהסכום יהיה בעמודות 37–51
        $line .= str_repeat('0',16); // עמודות 21–36
    
        // סה"כ סכום בקובץ (15 תווים, עמודות 37–51)
        $line .= str_pad($totals[$field],15,'0',STR_PAD_LEFT);
    
        // מספר הרשומות בקובץ (7 תווים, עמודות 52–58)
        $line .= str_pad($counts[$field],7,'0',STR_PAD_LEFT);
    
        // ריפוד לשאר עד 128 תווים
        $line .= str_repeat(' ', 128 - strlen($line));
    
        // סיום השורה
        $line .= "\r\n";
    
        // כתיבה לקובץ
        fwrite($fh, iconv("UTF-8", "Windows-1255//IGNORE", $line));
    
        // שורת סוגר - 128 ספרות 9 + CRLF
        $footer = str_repeat('9',128) . "\r\n";
        fwrite($fh, iconv("UTF-8", "Windows-1255//IGNORE", $footer));
    
        // סגירת הקובץ
        fclose($fh);
    
        echo "קובץ {$info['prefix']} נוצר: $filename<br>";
    }
    
} 
*/
// הפוך מחרוזת UTF-8 בצורה בטוחה
function mb_strrev($string) {
    // -1 במקום null
    $chars = preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY);
    return implode('', array_reverse($chars));
}

function parseJewishNames($sourceString) {
    $x = explode(' ', trim($sourceString));
    $surname = '';
    $given = '';

    if (count($x) == 2) {
        $surname = $x[0];
        $given = $x[1];
    } else {
        if (in_array($x[0], ['ון','בן','בר']) ||
            ($x[0] === 'אבא' && isset($x[1]) && $x[1] === 'שאול') ||
            ($x[0] === 'בעל' && isset($x[1]) && $x[1] === 'צדקה')) {
            $surname = $x[0] . ' ' . ($x[1] ?? '');
            $given = implode(' ', array_slice($x, 2));
        } elseif (count($x) >= 2 && (
            in_array($x[count($x)-2], ['ון','בן','בר']) ||
            ($x[count($x)-2] === 'אבא' && $x[count($x)-1] === 'שאול') ||
            ($x[count($x)-2] === 'בעל' && $x[count($x)-1] === 'צדקה')
        )) {
            $surname = $x[count($x)-2] . ' ' . $x[count($x)-1];
            $given = implode(' ', array_slice($x, 0, -2));
        } else {
            $surname = $x[count($x)-1];
            $given = implode(' ', array_slice($x, 0, -1));
        }
    }

    return [$given, $surname];
}

/**
 * יצירת קובץ MASAV
 */
function create_masav($month, $year) {
    global $sources;

    $rows = queryasarray("
        SELECT p.avrech_id, a.חשבון, a.סניף, a.בנק, a.פרטי, a.משפחה, a.תז,
               p.hefresh_ner_yisrael, p.hefresh_beit_yitzchak, p.hefresh_gmach_ner_yisrael
        FROM פעימות p
        JOIN אברכים a ON p.avrech_id = a.אברך_id
    ");

    $today_date = date("ymd");   // YYMMDD
    $today_file = date("Ymd");   // YYYYMMDD לשם הקובץ

    $files = [];
    $totals = [];
    $counts = [];

    foreach($sources as $field => $info){
        $has_value = false;
        foreach($rows as $r){
            $value = isset($r[$info['db_field']]) ? floatval($r[$info['db_field']]) : 0;
            if($value > 0){
                $has_value = true;
                break;
            }
        }

        if($has_value){
            $baseName = "masav_{$info['prefix']}_{$today_file}";
            $counter = 1;
            $filename = "{$baseName}.001";
            while(file_exists($filename)){
                $counter++;
                $filename = "{$baseName}_p{$counter}.001";
            }

            $files[$field] = fopen($filename, "wb");
            $totals[$field] = 0;
            $counts[$field] = 0;
// בתחילת הפונקציה, אחרי $files = [];
$debug_txt_file = fopen("beit_itzchak_debug.txt", "w");
            // שורת כותרת K – בדיוק 128 תווים
            $header = 'K';
            $header .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT);
            $header .= '00';
            $header .= $today_date;
            $header .= '0';
            $header .= '001';
            $header .= '0';
            $header .= $today_date;
            $header .= str_pad($info['sending_institution'],5,'0',STR_PAD_LEFT);
            $header .= str_repeat('0',6);
            $header .= str_pad(substr($info['institution_name'],0,30),30,' ',STR_PAD_RIGHT);
            $header .= str_repeat(' ',56);
            $header .= 'KOT';
            $header .= "\r\n";

            fwrite($files[$field], iconv("UTF-8", "CP862//IGNORE", $header));
        }
        

    }

    foreach($rows as $r){
        foreach($sources as $field => $info){
            if(!isset($files[$field])) continue;

            $value = isset($r[$info['db_field']]) ? floatval($r[$info['db_field']]) : 0;
            if($value > 0){
                $line = '1';
                $line .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT);
                $line .= '00';
                $line .= str_repeat('0',6);
                $line .= str_pad($r['בנק'] ?? '',2,'0',STR_PAD_LEFT);
                $line .= str_pad($r['סניף'] ?? '',3,'0',STR_PAD_LEFT);
                $line .= str_repeat('0',4);
                $line .= str_pad($r['חשבון'] ?? '',9,'0',STR_PAD_LEFT);
                $line .= '0';
                $line .= str_pad($r['תז'] ?? '',9,'0',STR_PAD_LEFT);

                // שם עברי – חיתוך והיפוך, בדיוק 16 תווים
                $full_name = trim(($r['משפחה'] ?? '') . ' ' . ($r['פרטי'] ?? ''));
                $full_name_cut = mb_substr($full_name, 0, 15, "UTF-8");
                $full_name_reversed = mb_strrev($full_name_cut);
                $full_name_padded = str_pad($full_name_reversed, 16, ' ', STR_PAD_RIGHT);
                $line .= iconv("UTF-8", "CP862//IGNORE", $full_name_padded);
               /* $full_name = trim(($r['משפחה'] ?? '') . ' ' . ($r['פרטי'] ?? ''));
                $full_name_cut = mb_substr($full_name, 0, 16, "UTF-8"); 
                $full_name_padded = str_pad($full_name_cut, 16, ' ', STR_PAD_RIGHT);
                $line .= iconv("UTF-8", "CP862//IGNORE", $full_name_padded);*/
                
                // סכום – חיתוך במקום עיגול
                //$amount = floor($value*100);
                $amount = intval(round($value * 100));

                $line .= str_pad($amount,13,'0',STR_PAD_LEFT);

                // מספר אברך
                $line .= str_pad($r['avrech_id'] ?? '',20,'0',STR_PAD_LEFT);

                // שדות נוספים
                $line .= '00000000';
                $line .= '000';
                $line .= '006';
                $line .= str_repeat('0',18);
                $line .= str_repeat(' ',2);

                $line .= "\r\n";
// כתיבה לקובץ קריא (רק לבית יצחק)
if ($info['prefix'] === 'beit_yitzchak') {
    $full_name = trim(($r['משפחה'] ?? '') . ' ' . ($r['פרטי'] ?? ''));
    $amount = intval($value);
    $debug_line = "אברך {$r['avrech_id']} | שם: {$full_name} | בנק: {$r['בנק']} | סניף: {$r['סניף']} | חשבון: {$r['חשבון']} | ת.ז: {$r['תז']} | סכום: {$amount}\n";
    fwrite($debug_txt_file, $debug_line);
}

               fwrite($files[$field], $line);
               //fwrite($files[$field], iconv("UTF-8", "CP862//IGNORE", $line));

                $totals[$field] += $amount;
                $counts[$field]++;
            }
        }
    }

    foreach($files as $field => $fh){
        $info = $sources[$field];
        $line = '5'; 
        $line .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT); // 1–8
        $line .= '00'; // 9–10
        $line .= $today_date; // 11–16 YYMMDD
        $line .= '0'; // 17
        $line .= '001'; // 18–20
    
        // ריפוד לפני הסכום כדי שהסכום יהיה בעמודות 37–51
        $line .= str_repeat('0',16); // עמודות 21–36
    
        // סה"כ סכום בקובץ (15 תווים, עמודות 37–51)
        $line .= str_pad($totals[$field],15,'0',STR_PAD_LEFT);
    
        // מספר הרשומות בקובץ (7 תווים, עמודות 52–58)
        $line .= str_pad($counts[$field],7,'0',STR_PAD_LEFT);
    
        // ריפוד לשאר עד 128 תווים
        $line .= str_repeat(' ', 128 - strlen($line));
    
        // סיום השורה
        $line .= "\r\n";
     // debug
     $debugLine = "שורת סיכום עבור {$field}:\n";
     $debugLine .= $line . "\n";
     $debugLine .= "Offset סכום (תווים 22-36): " . substr($line, 21, 15) . "\n";
     $debugLine .= "Offset מספר תנועות (תווים 52-58): " . substr($line, 51, 7) . "\n";
     $debugLine .= str_repeat('-',50) . "\n";
     file_put_contents('debug.txt', $debugLine, FILE_APPEND);
        // כתיבה לקובץ
       // fwrite($fh, iconv("UTF-8", "Windows-1255//IGNORE", $line));
        fwrite($fh, iconv("UTF-8", "CP862//IGNORE", $line));

        // שורת סוגר - 128 ספרות 9 + CRLF
        $footer = str_repeat('9',128) . "\r\n";
        fwrite($fh, iconv("UTF-8", "CP862//IGNORE", $footer));
        // שורת סיכום – בדיוק 128 תווים
       
        fclose($fh);

    }
    fclose($debug_txt_file);

}







?>
