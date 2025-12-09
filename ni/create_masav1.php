<?php
include_once 'dbq.php';
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
    'beit_yitzchak_pagi' => [
        'db_field' => 'hefresh_beit_yitzchak_pagi',
        'prefix' => 'beit_yitzchak_pagi',
        'institution_code' => '71504014',
        'sending_institution' => '71504',
        'institution_name' => 'בית יצחק פאגי',
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
function create_masav($month, $year) {
    global $sources;

    $rows = queryasarray("
        SELECT p.avrech_id, a.חשבון, a.סניף, a.בנק, a.פרטי, a.משפחה, a.תז,
               p.hefresh_ner_yisrael, p.hefresh_beit_yitzchak, p.hefresh_gmach_ner_yisrael, p.hefresh_beit_yitzchak_pagi
        FROM פעימות p
        JOIN אברכים a ON p.avrech_id = a.אברך_id
    ");

    $today_date = date("ymd");   
    $today_file = date("Ymd");   
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
            error_log("מהDB: " . $value);

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

                $full_name = trim(($r['משפחה'] ?? '') . ' ' . ($r['פרטי'] ?? ''));
                
               
                $full_name_cut = mb_substr($full_name, 0, 16, "UTF-8");
                $full_name_padded = str_pad($full_name_cut, 16, ' ', STR_PAD_RIGHT);
                $line .= iconv("UTF-8", "CP862//IGNORE", $full_name_padded);

               
               
                

                
                $amount = intval(round($value));


                $line .= str_pad($amount, 13, '0', STR_PAD_LEFT);
                $line .= str_pad($r['avrech_id'] ?? '',20,'0',STR_PAD_LEFT);

                $line .= '00000000';
                $line .= '000';
                $line .= '006';
                $line .= str_repeat('0',18);
                $line .= str_repeat(' ',2);

                $line .= "\r\n";

               fwrite($files[$field], $line);

                $totals[$field] += $amount;
                $counts[$field]++;
            }
        }
    }

    foreach($files as $field => $fh){
        $info = $sources[$field];
        $line = '5'; 
        $line .= str_pad($info['institution_code'],8,'0',STR_PAD_LEFT); // 1–8
        $line .= '00'; 
        $line .= $today_date; 
        $line .= '0'; 
        $line .= '001'; 
    
        $line .= str_repeat('0',16); 
    
        $line .= str_pad($totals[$field],15,'0',STR_PAD_LEFT);
    
        $line .= str_pad($counts[$field],7,'0',STR_PAD_LEFT);
    
        $line .= str_repeat(' ', 128 - strlen($line));
    
        $line .= "\r\n";
     
        fwrite($fh, iconv("UTF-8", "CP862//IGNORE", $line));

        $footer = str_repeat('9',128) . "\r\n";
        fwrite($fh, iconv("UTF-8", "CP862//IGNORE", $footer));
       
        fclose($fh);

    }
    


}