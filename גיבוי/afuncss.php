<?php
include_once 'dbq.php';
require_once 'create_masav.php';

// 🔁 פונקציות עזר =============================

function normalize_bool($val) {
    return ($val === true || $val === 'true' || $val === 't' || $val === 1) ? 't' : 'f';
}
/*function queryasline($sql, $params = []) {
    $arr = queryasarray($sql, $params);
    return $arr[0] ?? null;
}*/
function number_to_gematria($num) {
    $letters = [400 => "ת", 300 => "ש", 200 => "ר", 100 => "ק",
                90 => "צ", 80 => "פ", 70 => "ע", 60 => "ס", 50 => "נ", 40 => "מ", 
                30 => "ל", 20 => "כ", 10 => "י", 9 => "ט", 8 => "ח", 7 => "ז", 
                6 => "ו", 5 => "ה", 4 => "ד", 3 => "ג", 2 => "ב", 1 => "א"];
    $result = "";
    foreach ($letters as $value => $letter) {
        while ($num >= $value) {
            $result .= $letter;
            $num -= $value;
        }
    }
    return str_replace(["יה", "יו"], ["טו", "טז"], $result);
}

// 🔁 קריאות כלליות =============================

function getall_av($p) {
    $sql = 'SELECT * FROM "אברכים" WHERE "משפחה" IS NOT NULL AND  תאריך_עזיבה is null
    ORDER BY "משפחה", "פרטי" LIMIT 3000';
    return queryasarray($sql);
}

function getall_snifim($p) {
    return queryasarray('SELECT "סניף_id", "שם סניף" FROM "סניפים" ORDER BY "שם סניף"');
}

function getall_tarifim($p) {
    $sql = 'SELECT t.*, s."שם סניף"
            FROM "תעריפים" t
            LEFT JOIN "סניפים" s ON t."קוד סניף" = s."סניף_id"
            ORDER BY t."סטטוס" DESC, t."תאריך סיום"';
    return queryasarray($sql);
}

function getall_groups($p) {
    return queryasarray('SELECT "מספר", "שם", "סניף_id" FROM "קבוצות" ORDER BY "שם"');
}

// 🔁 אברכים מסוננים =============================
function get_av_filtered($p) {
    $snif_id = $p['snif_id'] ?? null;
    $group_name = $p['group_name'] ?? null;
    $month_name = $p['month_name'] ?? null;
    $year_hebrew = $p['year_hebrew'] ?? null;

    $params = [];
    $where = ['a."משפחה" IS NOT NULL AND a."תאריך_עזיבה" is null'];
    $i = 1;

    if ($group_name) {
        $where[] = 'k."שם" = $' . $i++;
        $params[] = $group_name;
    } elseif ($snif_id) {
        $where[] = 'k."סניף_id" = $' . $i++;
        $params[] = $snif_id;
    }

    $month_param = $i++;
    $params[] = $month_name;

    $year_param = $i++;
    $params[] = $year_hebrew;

    $whereString = implode(" AND ", $where);

    $sql = <<<SQL
SELECT 
  a."אברך_id", a."משפחה", a."פרטי", a."קבוצה", a."עיר", k."סניף_id",
  COALESCE(t."weekly_count", 0) AS weekly_count,
  COALESCE(t."monthly_test", false) AS monthly_test,
  COALESCE(t."chabura_pe", false) AS chabura_pe,
  COALESCE(t."chabura_ktav", false) AS chabura_ktav,
  COALESCE(t."sugya_summary", 0) AS sugya_summary,
  
  /*h."base", h."sm", h."sdarim_Z", h."sdarim_Z_sum",*/
  a."מעשר_קבוע", a."מעשר_באחוזים",
  COALESCE(pay."סכום_מבחנים", 0) AS "סכום",
  COALESCE(pay."סכום_תיקונים", 0) AS "סכום_תיקונים",
  COALESCE(pay."סכום_כולל", 0) AS "סכום_כולל",
  COALESCE(pay."בית_יצחק", 0) AS "בית_יצחק",
  COALESCE(pay."בית_יצחק_פאגי", 0) AS "בית_יצחק_פאגי",
  COALESCE(pay."גמח_נר_ישראל", 0) AS "גמח_נר_ישראל",
  
  COALESCE(pay."תווי_קניה_שח", tav."סכום", 0) AS "תוים",
  COALESCE(pay."חנות_תו", tav."חנות") AS "חנות_תוים",
  pay."בסיס"AS "base",pay."שמירת_סדרים" AS "sm",pay."סך_סדר_זכאי" AS "sdarim_Z_sum",h."sdarim_Z",
  COALESCE(tosafot."תוספות", '[]'::jsonb) AS "תוספות"
FROM "אברכים" a
JOIN "קבוצות" k ON a."קבוצה" = k."שם"
LEFT JOIN test_summary t ON t."avrech_id" = a."אברך_id"
  AND t."month_name" = $$month_param AND t."year_hebrew" = $$year_param
LEFT JOIN "h_to_office" h ON a."תז" = h."tz"/* AND h."m" = $$month_param AND h."y" = $$year_param*/
LEFT JOIN "תווי_קניה_קבועים" tav ON tav."אברך_id" = a."אברך_id" AND tav."פעיל" = TRUE
LEFT JOIN "תשלומים" pay ON pay.avrech_id = a."אברך_id"
  AND pay."חודש" = $$month_param AND pay."שנה" = $$year_param
LEFT JOIN LATERAL (
  SELECT jsonb_agg(
    jsonb_build_object(
      'שם', replace(tik."סוג_תיקון", 'תוספת: ', ''),
      'כמות', tik."כמות",
      'תעריף', tt."תעריף",
      'סכום', COALESCE(tt."תעריף", 0) * COALESCE(tik."כמות", 1)
    )
  ) AS "תוספות"
  FROM "תיקונים" tik
  JOIN "תוספות" tt ON tt."שם תוספת" = replace(tik."סוג_תיקון", 'תוספת: ', '')
  WHERE tik."avrech_id" = a."אברך_id"
    AND tik."חודש" = $$month_param
    AND tik."שנה" = $$year_param
    AND tik."סוג_תיקון" LIKE 'תוספת:%'
) AS tosafot ON true
WHERE $whereString
ORDER BY a."משפחה", a."פרטי"
LIMIT 3000
SQL;

    return queryasarray($sql, $params);
}






// 🔁 תעריפים =============================

function add_tarif($p) {
    $kod_snif = $p['קוד סניף'];
    $ldate = $p['תאריך התחלה'];

    $exists = queryasarray('SELECT 1 FROM "תעריפים" WHERE "קוד סניף" = $1 AND "סטטוס" = $2 LIMIT 1', [$kod_snif, 'כן']);

    if ($exists) {
        doq('UPDATE "תעריפים" SET "סטטוס" = $1, "תאריך סיום" = $2 WHERE "קוד סניף" = $3 AND "סטטוס" = $4',
            ['לא', $ldate, $kod_snif, 'כן']);
    }

    $fields = array_keys($p);
    $values = array_values($p);
    $placeholders = array_map(fn($i) => '$' . ($i + 1), array_keys($fields));

    $sql = 'INSERT INTO "תעריפים" ("' . implode('","', $fields) . '") VALUES (' . implode(',', $placeholders) . ')';
    doq($sql, $values);

    return ['ok' => true];
}
function get_tarif_for_avrech_and_date($avrech_id, $ldate) {

    /* ==============================
       שלב 1 — שליפת קבוצה של האברך
       ============================== */

    $avrech = queryasrow(
        'SELECT "קבוצה"
         FROM "אברכים"
         WHERE "אברך_id" = $1',
        [$avrech_id]
    );

    if (!$avrech || empty($avrech["קבוצה"])) {
        error_log("לא נמצאה קבוצה לאברך $avrech_id");
        return null;
    }

    /* ==============================
       שלב 2 — קבלת סניף מהקבוצה
       ============================== */

    $group = queryasrow(
        'SELECT "סניף_id"
         FROM "קבוצות"
         WHERE "שם" = $1',
        [$avrech["קבוצה"]]
    );

    if (!$group || !$group["סניף_id"]) {
        error_log("לא נמצא סניף לקבוצה " . $avrech["קבוצה"]);
        return null;
    }

    $snif_id = $group["סניף_id"];

    /* ==============================
       שלב 3 — שליפת תעריף לפי תאריך
       ============================== */

    $tarif = queryasrow(
        'SELECT *
         FROM "תעריפים"
         WHERE "קוד סניף" = $1
           AND ("סטטוס" = \'פעיל\' OR "סטטוס" = \'כן\')
           AND "תאריך התחלה" <= $2
           AND ("תאריך סיום" IS NULL OR "תאריך סיום" >= $2)
         ORDER BY "תאריך התחלה" DESC
         LIMIT 1',
        [$snif_id, $ldate]
    );

    if (!$tarif) {
        error_log("לא נמצא תעריף לסניף $snif_id בתאריך $ldate");
    }

    return $tarif;
}


// 🔁 תוספות =============================

function get_tosafot($p) {
    return queryasarray('SELECT * FROM "תוספות" ORDER BY "id"');
}

function update_tosafot($p) {
    $sql = 'UPDATE "תוספות" SET "תעריף" = $1, "קבוע" = $2 WHERE "id" = $3';
    doq($sql, [$p['תעריף'], normalize_bool($p['קבוע']), $p['id']]);
    return ['ok' => true];
}

function add_tosefet($p) {
    $p['קבוע'] = normalize_bool($p['קבוע'] ?? false);
    $fields = array_keys($p);
    $values = array_values($p);
    $placeholders = array_map(fn($i) => '$' . ($i + 1), array_keys($fields));

    $sql = 'INSERT INTO "תוספות" ("' . implode('","', $fields) . '") VALUES (' . implode(',', $placeholders) . ')';
    $id = doqinsert($sql, $values);
    return $id ? ['ok' => true, 'id' => $id] : ['ok' => false];
}

// 🔁 תאריכים עבריים =============================

function ldatetohebdate($p) {
    $ldate = $p['ldate'] ?? '';
    if (!$ldate || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $ldate)) return ['error' => 'תאריך שגוי'];
    [$year, $month, $day] = explode('-', $ldate);
    $jd = gregoriantojd((int)$month, (int)$day, (int)$year);
    [$hMonth, $hDay, $hYear] = explode('/', jdtojewish($jd));
    return [
        'd' => (int)$hDay,
        'm' => (int)$hMonth,
        'y' => (int)$hYear,
        'text' => number_to_gematria((int)$hDay) . ' ב' .
                  heb_month_name((int)$hMonth) . ' ' .
                  number_to_gematria((int)$hYear % 1000)
    ];
}

function heb_month_name($m) {
    $months = [1 => 'תשרי', 2 => 'חשוון', 3 => 'כסלו', 4 => 'טבת', 5 => 'שבט',
               6 => 'אדר א', 7 => 'אדר ב', 8 => 'ניסן', 9 => 'אייר', 10 => 'סיוון', 11 => 'תמוז', 12 => 'אב', 13 => 'אלול'];
    return $months[$m] ?? "לא ידוע";
}

function hebtold($p) {
    $hdate = $p['hdate'] ?? '';
    $parts = explode('-', $hdate);
    if (count($parts) < 2) return ['error' => 'Invalid Hebrew date'];
    $day = count($parts) == 3 ? $parts[0] : 1;
    $month = $parts[count($parts) == 3 ? 1 : 0];
    $year = $parts[count($parts) == 3 ? 2 : 1];

    if (!is_numeric($month)) {
        //$month = array_search(trim($month), array_flip(heb_month_name(0))) ?: null;
        $months = [
            'תשרי' => 1, 'חשוון' => 2, 'כסלו' => 3, 'טבת' => 4, 'שבט' => 5,
            'אדר א' => 6, 'אדר ב' => 7, 'ניסן' => 8, 'אייר' => 9, 'סיוון' => 10,
            'תמוז' => 11, 'אב' => 12, 'אלול' => 13,
            'אדר' => 6 // לתמיכה גם באדר רגיל (בשנים לא מעוברות)
        ];
        
        $month = $months[trim($month)] ?? null;
        
        if (!$month) return ['error' => 'Unknown month'];
        
    }

    $jd = jewishtojd((int)$month, (int)$day, (int)$year);
    [$m, $d, $y] = explode('/', jdtogregorian($jd));
    return ['ldate' => sprintf('%04d-%02d-%02d', $y, $m, $d)];
}
//מבחנים

function save_tests($payload) {
    global $db;

    if (!$db) {
        $db = connect();
    }

    static $prepared = false;
    if (!$prepared) {
     
      pg_prepare($db, "save_test_stmt", "INSERT INTO test_summary 
 (avrech_id, month_name, year_hebrew, weekly_count, monthly_test, ldate, chabura_pe, chabura_ktav, sugya_summary)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (avrech_id, month_name, year_hebrew) DO UPDATE SET
  weekly_count = EXCLUDED.weekly_count,
  monthly_test = EXCLUDED.monthly_test,
  ldate = COALESCE(EXCLUDED.ldate, test_summary.ldate),
  chabura_pe = EXCLUDED.chabura_pe,
  chabura_ktav = EXCLUDED.chabura_ktav,
  sugya_summary = EXCLUDED.sugya_summary");


        $prepared = true;
    }

    foreach ($payload as $row) {
        $avrech_id = (int)$row['avrech_id'];
        $month_name = $row['month_name'];
        $year_hebrew = $row['year_hebrew'];
        $weekly_count = (int)$row['weekly_count'];
        $monthly_test = $row['monthly_test'] ? 'true' : 'false';
        $chabura_pe = normalize_bool($row['chabura_pe'] ?? false);
        $chabura_ktav = normalize_bool($row['chabura_ktav'] ?? false);
        $sugya_summary = (int)($row['sugya_summary'] ?? 0);
        
        // אם ldate ריק או לא קיים, נשלח NULL ל-Postgres
        $ldate = isset($row['ldate']) && $row['ldate'] !== '' ? $row['ldate'] : null;
        error_log("תאריך לועזי שנשלח: " . var_export($ldate, true));

        $result = pg_execute($db, "save_test_stmt", [
            $avrech_id, $month_name, $year_hebrew,
            $weekly_count, $monthly_test, $ldate,
            $chabura_pe, $chabura_ktav, $sugya_summary
        ]);
        
        //pg_execute($db, "save_test_stmt", [$avrech_id, $month_name, $year_hebrew, $weekly_count, $monthly_test, $ldate]);
        if (!$result) {
            error_log("שגיאה בשמירה: " . pg_last_error($db));
        }    }

    return ['status' => 'ok'];
}
//-------------------תיקונים
/*function add_fix($p) {
    // רשימת סוגי תיקון שדורשים בדיקה ב-test_summary
 $fix_types_needing_summary_check = [
    "מבחן שבועי",
    "מבחן חודשי",
    "חבורה בעפ",
    "חבורה בכתב",
    "סיכום סוגיות"
 ];

 if (in_array($p['סוג_תיקון'], $fix_types_needing_summary_check, true)) {
    $exists = queryasarray("SELECT 1 FROM test_summary WHERE avrech_id = $1 AND month_name = $2 AND year_hebrew = $3", [
        $p['avrech_id'], $p['חודש'], $p['שנה']
    ]);

    if (empty($exists)) {
        return ['success' => false, 'error' => 'לא קיימת שורת סיכום עבור החודש והשנה הנתונים'];
    }
 }

    $ldate = $p['תאריך_לועזי'] ?? null;
    if ($ldate === '0000-00-00' || $ldate === '') {
        $ldate = null;
    }

    $tarifTosefet = isset($p['תעריף_תוספת']) ? floatval($p['תעריף_תוספת']) : 0;

    $sql = 'INSERT INTO "תיקונים" 
        ("avrech_id", "שנה", "חודש", "סוג_תיקון", "כמות", "הערה", "תאריך_לועזי", "תאריך_קליטה", "חודש_תיקון", "שנה_תיקון")
        VALUES ($1,$2,$3,$4,$5,$6,$7, now(), $8, $9)';

    $params = [
        $p['avrech_id'],
        $p['שנה'],
        $p['חודש'],
        $p['סוג_תיקון'],
        $p['כמות'] ?? 1,
        $p['הערה'] ?? '',
        $ldate,
        $p['חודש_תיקון'] ?? '',
        $p['שנה_תיקון'] ?? ''
    ];

    $id = doqinsert($sql, $params);

    // עדכון test_summary
    switch ($p["סוג_תיקון"]) {
        case "מבחן שבועי":
            doq(<<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, weekly_count)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET weekly_count = test_summary.weekly_count + $4
            SQL, [$p["avrech_id"], $p["חודש"], $p["שנה"], $p["כמות"]]);
            break;
        case "מבחן חודשי":
            doq(<<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, monthly_test)
                VALUES ($1, $2, $3, true)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET monthly_test = true
            SQL, [$p["avrech_id"], $p["חודש"], $p["שנה"]]);
            break;
        case "חבורה בעפ":
            doq(<<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, chabura_pe)
                VALUES ($1, $2, $3, true)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET chabura_pe = true
            SQL, [$p["avrech_id"], $p["חודש"], $p["שנה"]]);
            break;
        case "חבורה בכתב":
            doq(<<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, chabura_ktav)
                VALUES ($1, $2, $3, true)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET chabura_ktav = true
            SQL, [$p["avrech_id"], $p["חודש"], $p["שנה"]]);
            break;
        case "סיכום סוגיות":
            doq(<<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, sugya_summary)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET sugya_summary = test_summary.sugya_summary + $4
            SQL, [$p["avrech_id"], $p["חודש"], $p["שנה"], $p["כמות"]]);
            break;
    }

    // קריאה לפונקציה שמעדכנת תשלומים, נעביר לה את תעריף התוספת
    apply_fix_and_update_payment([
        "avrech_id" => $p['avrech_id'],
        "חודש" => $p['חודש'],
        "שנה" => $p['שנה'],
        "חודש_תיקון" => $p['חודש_תיקון'],
        "שנה_תיקון" => $p['שנה_תיקון'],
        "תעריף_תוספת" => $tarifTosefet,
        "סכום_אחר_מעשר" => $p['סכום_אחר_מעשר'] ?? 0,
       // "ישראשראי" => $p['ישראשראי'] ?? 0,
      //  "תשלום_אחר" => $p['תשלום_אחר'] ?? 0
        

    ]);

    return ['success' => true, 'id' => $id];
}*/

function add_fix(array $p) {
    // סוגי תיקון שדורשים בדיקת שורת סיכום
    $fix_types_needing_summary_check = [
        "מבחן שבועי",
        "מבחן חודשי",
        "חבורה בעפ",
        "חבורה בכתב",
        "סיכום סוגיות"
    ];

    $avrech_id = $p['avrech_id'];
    $month = $p['חודש'];
    $year = $p['שנה'];
    $fix_month = $p['חודש_תיקון'] ?? null;
    $fix_year = $p['שנה_תיקון'] ?? null;

    // בדיקת קיום שורת סיכום לפי סוג התיקון
    if (in_array($p['סוג_תיקון'], $fix_types_needing_summary_check, true)) {
        $exists = queryasarray(
            "SELECT 1 FROM test_summary WHERE avrech_id = $1 AND month_name = $2 AND year_hebrew = $3",
            [$avrech_id, $month, $year]
        );

        if (empty($exists)) {
            return [
                'success' => false,
                'error' => 'לא קיימת שורת סיכום עבור החודש והשנה הנתונים'
            ];
        }
    }

    // ניקוי תאריך לועזי
    $ldate = $p['תאריך_לועזי'] ?? null;
    if ($ldate === '0000-00-00' || $ldate === '') {
        $ldate = null;
    }

    $tarifTosefet = isset($p['תעריף_תוספת']) ? floatval($p['תעריף_תוספת']) : 0;
    $quantity = isset($p['כמות']) ? intval($p['כמות']) : 1;
    $note = $p['הערה'] ?? '';

    // הוספת תיקון לטבלה
    $sql = <<<SQL
        INSERT INTO "תיקונים"
        ("avrech_id", "שנה", "חודש", "סוג_תיקון", "כמות", "הערה", "תאריך_לועזי", "תאריך_קליטה", "חודש_תיקון", "שנה_תיקון")
        VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8, $9)
    SQL;

    $params = [
        $avrech_id,
        $year,
        $month,
        $p['סוג_תיקון'],
        $quantity,
        $note,
        $ldate,
        $fix_month,
        $fix_year
    ];

    $id = doqinsert($sql, $params);

    // מיפוי סוג התיקון לשדות ולעדכון בטבלת test_summary
    $summary_field_map = [
        "מבחן שבועי" => ['field' => 'weekly_count', 'increment' => true, 'value' => $quantity],
        "מבחן חודשי" => ['field' => 'monthly_test', 'increment' => false, 'value' => true],
        "חבורה בעפ" => ['field' => 'chabura_pe', 'increment' => false, 'value' => true],
        "חבורה בכתב" => ['field' => 'chabura_ktav', 'increment' => false, 'value' => true],
        "סיכום סוגיות" => ['field' => 'sugya_summary', 'increment' => true, 'value' => $quantity],
    ];

    if (isset($summary_field_map[$p['סוג_תיקון']])) {
        $fieldInfo = $summary_field_map[$p['סוג_תיקון']];
        if ($fieldInfo['increment']) {
            $sqlUpdate = <<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, {$fieldInfo['field']})
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET {$fieldInfo['field']} = test_summary.{$fieldInfo['field']} + EXCLUDED.{$fieldInfo['field']}
            SQL;
            doq($sqlUpdate, [$avrech_id, $month, $year, $fieldInfo['value']]);
        } else {
            $sqlUpdate = <<<SQL
                INSERT INTO test_summary (avrech_id, month_name, year_hebrew, {$fieldInfo['field']})
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (avrech_id, month_name, year_hebrew)
                DO UPDATE SET {$fieldInfo['field']} = EXCLUDED.{$fieldInfo['field']}
            SQL;
            doq($sqlUpdate, [$avrech_id, $month, $year, $fieldInfo['value']]);
        }
    }
    // קריאה לפונקציה לעדכון תשלומים
    //יירוקקקקקקקקקקקקקקקקקקקקקקקקקקקקקקקקקקק
  /* apply_fix_and_update_payment([
        "avrech_id" => $avrech_id,
        "חודש" => $month,
        "שנה" => $year,
        "חודש_תיקון" => $fix_month,
        "שנה_תיקון" => $fix_year,
        "תעריף_תוספת" => $tarifTosefet,
        "סכום_אחר_מעשר" => $p['סכום_אחר_מעשר'] ?? 0,

    ]); 
    */
    apply_fix_and_update_payment([
        "avrech_id" => $avrech_id,
        "חודש" => $month,
        "שנה" => $year,
        "חודש_תיקון" => $fix_month ?? $month,
        "שנה_תיקון" => $fix_year ?? $year,
        "סוג_תיקון" => $p['סוג_תיקון']
    ]);
    
    return ['success' => true, 'id' => $id];
}


function isTosefet($type) {
    if ($type === 'מעשר מתוספת חג') return true; // החרגה ידנית

    $res = queryasarray('SELECT 1 FROM "תוספות" WHERE "שם תוספת" = $1 LIMIT 1', [$type]);
    return count($res) > 0;
}




function get_fixes_for_avrech($p) {
    $avrech_id = $p["avrech_id"];
    $month = $p["חודש"];
    $year = $p["שנה"];

    return queryasarray(<<<SQL
      SELECT סוג_תיקון, הערה, חודש, שנה, כמות, תאריך_קליטה
      FROM תיקונים
      WHERE avrech_id = $1 AND חודש_תיקון = $2 AND שנה_תיקון = $3
      ORDER BY תאריך_קליטה DESC
    SQL, [$avrech_id, $month, $year]);
}


   

function get_fix_totals($p) {
    $month = $p["month"] ?? null;
    $year = $p["year"] ?? null;

    if (!$month || !$year) {
        return ["error" => "חסר חודש או שנה"];
    }

    $rows = queryasarray('SELECT avrech_id, "סכום_תיקונים" FROM "תשלומים" WHERE "חודש" = $1 AND "שנה" = $2', [$month, $year]);
    $map = [];
    foreach ($rows as $r) {
        $map[$r["avrech_id"]] = floatval($r["סכום_תיקונים"] ?? 0);
    }
    return ["payments" => $map];
}
//נסיון=========================
function get_tarif_for_date($avrech_id, $date) {
    // שולף את התעריף לפי קבוצה וסניף
    return queryasrow(
        'SELECT t.*
         FROM "אברכים" a
         JOIN "קבוצות" k ON a."קבוצה" = k."שם"
         JOIN "תעריפים" t ON t."קוד סניף" = k."סניף_id"
         WHERE a."אברך_id" = $1
           AND t."תאריך התחלה" <= $2
           AND (t."תאריך סיום" >= $2 OR t."תאריך סיום" IS NULL)
           AND t."סטטוס" = \'כן\'
         ORDER BY t."תאריך התחלה" DESC
         LIMIT 1',
        [$avrech_id, $date]
    );
}



// ------------------------------------------------------------
// מחשב את הסכום של תיקון/מבחן/חבורה/סוגיה
// ------------------------------------------------------------
function calc_tikun_amount($avrech_id, $sug, $kamut = 1, $summary = null, $tarif = null) {
    if(!$summary || !$tarif) {
        // שליפת סיכום ותעריף אם לא סופקו
        $summary = queryasrow('SELECT * FROM test_summary WHERE avrech_id=$1', [$avrech_id]);
        $ldate = $summary["ldate"] ?? date('Y-m-d');
        $tarif = get_tarif_for_date($avrech_id, $ldate);
    }

    $amount = 0;

    switch ($sug) {
        case 'מבחן שבועי':
            if(intval($summary["weekly_count"]) >= 2) {
                $amount = floatval($tarif["תעריף מבחן שבועי"] ?? 0);
                error_log("חישוב מבחן שבועי: weekly_count={$summary["weekly_count"]}, amount={$amount}");
            }
            break;

        case 'מבחן חודשי':
            if(intval($summary["weekly_count"]) >= 3 && ($summary["monthly_test"] === 't' || $summary["monthly_test"] === true)) {
                $amount = floatval($tarif["תעריף מבחן חודשי"] ?? 0);
            }
            break;

        case 'חבורה':
            if($summary["chabura_pe"] === 't' || $summary["chabura_pe"] === true) {
                $amount = floatval($tarif["תעריף חבורה"] ?? 0);
                if($summary["chabura_ktav"] === 't' || $summary["chabura_ktav"] === true) {
                    $amount += floatval($tarif["תעריף חבורה"] ?? 0);
                }
            }
            break;

        case 'סוגיה':
            $amount = intval($summary["sugya_summary"]) * floatval($tarif["תעריף סוגיה"] ?? 0);
            break;

        case 'בסיס':
            $amount = floatval($tarif["תעריף בסיס"] ?? 0);
            break;

        default:
            $amount = 0;
    }

    return $kamut * $amount;
}

function apply_fix_and_update_payment($p) {

    error_log("🔎 נתונים שהתקבלו לפונקציה:");
    error_log(print_r($p, true));

    $month = preg_replace('/\s+/', '', trim($p["חודש"] ?? ''));
    $year = preg_replace('/\s+/', '', trim($p["שנה"] ?? ''));
    $year = str_replace(['״', '"', "'", '׳'], '', $year);

    $avrech_id = intval($p["avrech_id"]);
    $fix_month = $p["חודש_תיקון"] ?? null;
    $fix_year  = $p["שנה_תיקון"] ?? null;

    $maanak = 0;

    $summary = queryasrow(
        'SELECT * FROM test_summary 
         WHERE avrech_id=$1 AND month_name=$2 AND year_hebrew=$3',
        [$avrech_id, $month, $year]
    );

    $ldate = $summary["ldate"] ?? null;

    $tarif = get_tarif_for_avrech_and_date($avrech_id, $ldate);

    $sum = 0;
    if ($summary) {
        $weeklyCount = intval($summary["weekly_count"]);
        $monthlyTest = ($summary["monthly_test"] === 't');
        $chaburaPe   = ($summary["chabura_pe"] === 't');
        $chaburaKtav = ($summary["chabura_ktav"] === 't');
        $sugyaCount  = intval($summary["sugya_summary"]);

        if ($weeklyCount >= 2) {
            $sum += $weeklyCount * floatval($tarif["תעריף מבחן שבועי"]);
            if ($weeklyCount >= 3 && $monthlyTest) {
                $sum += floatval($tarif["תעריף מבחן חודשי"]);
            }
        }

        if ($chaburaPe) {
            $sum += floatval($tarif["תעריף חבורה"]);
            if ($chaburaKtav) {
                $sum += floatval($tarif["תעריף חבורה"]);
            }
        }

        $sum += $sugyaCount * floatval($tarif["תעריף סוגיה"]);
    }
    $sum = round($sum, 2);

    $paymentRow = queryasrow(
        'SELECT "סכום_מבחנים","סכום_תיקונים" FROM "תשלומים"
         WHERE avrech_id=$1 AND "חודש"=$2 AND "שנה"=$3',
        [$avrech_id, $month, $year]
    );

    if (!$paymentRow) {
        doq(
            'INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", "סכום_מבחנים","סכום_תיקונים")
             VALUES ($1,$2,$3,0,0)',
            [$avrech_id, $month, $year]
        );
        $prev = 0;
    } else {
        $prev = floatval($paymentRow["סכום_מבחנים"]);
    }

    $diff = round($sum - $prev, 2);
    error_log("SUM = $sum | PREV = $prev | DIFF = $diff");

    if ($diff != 0) {
        doq(
            'UPDATE "תשלומים"
             SET "סכום_מבחנים"=$1
             WHERE avrech_id=$2 AND "חודש"=$3 AND "שנה"=$4',
            [$sum, $avrech_id, $month, $year]
        );
    }

    $kolel_data = queryasrow(
        'SELECT 
            COALESCE("sdarim_Z_sum",0) AS sdr,
            COALESCE("base",0) AS base,
            COALESCE("sm",0) AS sm
         FROM "h_to_office"
         JOIN "אברכים" ON "tz"="תז"
         WHERE "אברך_id"=$1
         LIMIT 1',
        [$avrech_id]
    );

    $total_sum = 0;
    if ($kolel_data) {
        $total_sum = round(
            floatval($kolel_data['sdr']) +
            floatval($kolel_data['base']) +
            floatval($kolel_data['sm']),
            2
        );
    }

    $type = $p["סוג_תיקון"] ?? '';

    // שליפת סכום תיקונים קיים לטופס תיקון
    $existing_fix = 0;
    $fixPaymentRow = queryasrow(
        'SELECT "סכום_תיקונים" FROM "תשלומים"
         WHERE avrech_id=$1 AND "חודש"=$2 AND "שנה"=$3',
        [$avrech_id, $fix_month, $fix_year]
    );
    if ($fixPaymentRow) {
        $existing_fix = floatval($fixPaymentRow["סכום_תיקונים"] ?? 0);
    }

    $amount = 0;

    if ($type === 'מעשר מתוספת חג') {
        $percentRow = queryasrow(
            'SELECT "מעשר_באחוזים" FROM "אברכים" WHERE "אברך_id"=$1',
            [$avrech_id]
        );
        $percent = floatval($percentRow["מעשר_באחוזים"] ?? 0);
        $amount = ($percent > 0) ? -round(($percent/100)*400,2) : 0;

    } elseif (str_starts_with($type,'תוספת: ')) {
        $tosafetName = trim(substr($type,8));
        $tosafetNameClean = trim(str_replace(['ת:', '"'], '', $tosafetName));
        $resTosefet = queryasrow(
            'SELECT "תעריף" FROM "תוספות" WHERE "שם תוספת" ILIKE $1 LIMIT 1',
            ["%$tosafetNameClean%"]
        );
        if (!$resTosefet)
            return ["error"=>"לא נמצא תעריף לתוספת $tosafetName"];
        $amount = floatval($resTosefet["תעריף"]);
        $maanak = $amount;

    } elseif ($type === 'אחר') {
        $amount = floatval($p["סכום_חופשי"] ?? 0);
        if ($amount == 0)
            return ["error"=>"לא הוזן סכום חופשי"];

    } else {
        $amount = $diff;
    }

   // $new_fix_sum = round($existing_fix + $amount, 2);
    $new_fix_sum = round($amount, 2);
   /* doq(
        'UPDATE "תשלומים"
         SET "סכום_תיקונים"=$1
         WHERE avrech_id=$2 AND "חודש"=$3 AND "שנה"=$4',
        [$new_fix_sum, $avrech_id, $fix_month, $fix_year]
    );/*/

    $kolel_sum = round($total_sum + $sum + $new_fix_sum, 2);

    save_or_fix_payments([[ 
        "avrech_id"=>$avrech_id,
        "חודש"=>$fix_month,
        "שנה"=>$fix_year,
        "סכום_תיקונים"=>$new_fix_sum,
        "סכום_כולל"=>$kolel_sum,
        "is_fix"=>true,
        "maanakIsra"=>$maanak,
        "סוג_תיקון"=>$type,
        "for_month"=>$month,
        "for_year"=>$year

    ]]);

    return [
        "success"=>true,
        "new_sum"=>$sum,
        "diff"=>$diff,
        "fix_sum"=>$new_fix_sum,
        "kolel_sum"=>$kolel_sum
    ];
}


// function apply_fix_and_update_payment($p) {

//     error_log("🔎 נתונים שהתקבלו לפונקציה:");
//     error_log(print_r($p, true));

//     /* ================= ניקוי קלט ================= */
//     $month = preg_replace('/\s+/', '', trim($p["חודש"] ?? ''));
//     $year = preg_replace('/\s+/', '', trim($p["שנה"] ?? ''));
//     $year = str_replace(['״', '"', "'", '׳'], '', $year);

//     $avrech_id = intval($p["avrech_id"]);
//     $fix_month = $p["חודש_תיקון"] ?? null;
//     $fix_year  = $p["שנה_תיקון"] ?? null;

//     $maanak = 0;

//     /* ================= שליפת summary ================= */
//     $summary = queryasrow(
//         'SELECT * FROM test_summary 
//          WHERE avrech_id=$1 AND month_name=$2 AND year_hebrew=$3',
//         [$avrech_id, $month, $year]
//     );

//     $ldate = $summary["ldate"] ?? null;

//     /* ================= שליפת תעריף ================= */
//     $tarif = get_tarif_for_avrech_and_date($avrech_id, $ldate);

//     /* ================= חישוב סכום מבחנים ================= */
//     $sum = 0;
//     if ($summary) {
//         $weeklyCount = intval($summary["weekly_count"]);
//         $monthlyTest = ($summary["monthly_test"] === 't');
//         $chaburaPe   = ($summary["chabura_pe"] === 't');
//         $chaburaKtav = ($summary["chabura_ktav"] === 't');
//         $sugyaCount  = intval($summary["sugya_summary"]);

//         if ($weeklyCount >= 2) {
//             $sum += $weeklyCount * floatval($tarif["תעריף מבחן שבועי"]);
//             if ($weeklyCount >= 3 && $monthlyTest) {
//                 $sum += floatval($tarif["תעריף מבחן חודשי"]);
//             }
//         }

//         if ($chaburaPe) {
//             $sum += floatval($tarif["תעריף חבורה"]);
//             if ($chaburaKtav) {
//                 $sum += floatval($tarif["תעריף חבורה"]);
//             }
//         }

//         $sum += $sugyaCount * floatval($tarif["תעריף סוגיה"]);
//     }
//     $sum = round($sum, 2);

//     /* ================= הבטחת שורת תשלומים ================= */
//     $paymentRow = queryasrow(
//         'SELECT "סכום_מבחנים","סכום_תיקונים" FROM "תשלומים"
//          WHERE avrech_id=$1 AND "חודש"=$2 AND "שנה"=$3',
//         [$avrech_id, $month, $year]
//     );

//     if (!$paymentRow) {
//         doq(
//             'INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", "סכום_מבחנים","סכום_תיקונים")
//              VALUES ($1,$2,$3,0,0)',
//             [$avrech_id, $month, $year]
//         );
//         $prev = 0;
//     } else {
//         $prev = floatval($paymentRow["סכום_מבחנים"]);
//     }

//     /* ================= חישוב הפרש ================= */
//     $diff = round($sum - $prev, 2);
//     error_log("SUM = $sum | PREV = $prev | DIFF = $diff");

//     if ($diff != 0) {
//         doq(
//             'UPDATE "תשלומים"
//              SET "סכום_מבחנים"=$1
//              WHERE avrech_id=$2 AND "חודש"=$3 AND "שנה"=$4',
//             [$sum, $avrech_id, $month, $year]
//         );
//     }

//     $kolel_data = queryasrow(
//         'SELECT 
//             COALESCE("sdarim_Z_sum",0) AS sdr,
//             COALESCE("base",0) AS base,
//             COALESCE("sm",0) AS sm
//          FROM "h_to_office"
//          JOIN "אברכים" ON "tz"="תז"
//          WHERE "אברך_id"=$1
//          LIMIT 1',
//         [$avrech_id]
//     );

//     $total_sum = 0;
//     if ($kolel_data) {
//         $total_sum = round(
//             floatval($kolel_data['sdr']) +
//             floatval($kolel_data['base']) +
//             floatval($kolel_data['sm']),
//             2
//         );
//     }

//     $type = $p["סוג_תיקון"] ?? '';

//     // שליפת סכום תיקונים קיים לטופס תיקון
//     $existing_fix = 0;
//     $fixPaymentRow = queryasrow(
//         'SELECT "סכום_תיקונים" FROM "תשלומים"
//          WHERE avrech_id=$1 AND "חודש"=$2 AND "שנה"=$3',
//         [$avrech_id, $fix_month, $fix_year]
//     );
//     if ($fixPaymentRow) {
//         $existing_fix = floatval($fixPaymentRow["סכום_תיקונים"] ?? 0);
//     }

//     $amount = 0;

//     if ($type === 'מעשר מתוספת חג') {
//         $percentRow = queryasrow(
//             'SELECT "מעשר_באחוזים" FROM "אברכים" WHERE "אברך_id"=$1',
//             [$avrech_id]
//         );
//         $percent = floatval($percentRow["מעשר_באחוזים"] ?? 0);
//         $amount = ($percent > 0) ? -round(($percent/100)*400,2) : 0;

//     } elseif (str_starts_with($type,'תוספת: ')) {
//         $tosafetName = trim(substr($type,8));
//         $tosafetNameClean = trim(str_replace(['ת:', '"'], '', $tosafetName));
//         $resTosefet = queryasrow(
//             'SELECT "תעריף" FROM "תוספות" WHERE "שם תוספת" ILIKE $1 LIMIT 1',
//             ["%$tosafetNameClean%"]
//         );
//         if (!$resTosefet)
//             return ["error"=>"לא נמצא תעריף לתוספת $tosafetName"];
//         $amount = floatval($resTosefet["תעריף"]);
//         $maanak = $amount;

//     } elseif ($type === 'אחר') {
//         $amount = floatval($p["סכום_חופשי"] ?? 0);
//         if ($amount == 0)
//             return ["error"=>"לא הוזן סכום חופשי"];

//     } else {
//         $amount = $diff;
//     }

//    // $new_fix_sum = round($existing_fix + $amount, 2);
//     $new_fix_sum = round($amount, 2);
//    /* doq(
//         'UPDATE "תשלומים"
//          SET "סכום_תיקונים"=$1
//          WHERE avrech_id=$2 AND "חודש"=$3 AND "שנה"=$4',
//         [$new_fix_sum, $avrech_id, $fix_month, $fix_year]
//     );*/

//     $kolel_sum = round($total_sum + $sum + $new_fix_sum, 2);

//     save_or_fix_payments([[ 
//         "avrech_id"=>$avrech_id,
//         "חודש"=>$fix_month,
//         "שנה"=>$fix_year,
//         "סכום_תיקונים"=>$new_fix_sum,
//         "סכום_כולל"=>$kolel_sum,
//         "is_fix"=>true,
//         "maanakIsra"=>$maanak,
//         "סוג_תיקון"=>$type,
//         "for_month"=>$month,
//         "for_year"=>$year

//     ]]);

//     return [
//         "success"=>true,
//         "new_sum"=>$sum,
//         "diff"=>$diff,
//         "fix_sum"=>$new_fix_sum,
//         "kolel_sum"=>$kolel_sum
//     ];
// }

function  maaser($avrech_id,$sumKolel){
    $sql_maaser = <<<SQL
    SELECT 
    COALESCE("מעשר_קבוע", 0) AS mkavua,
    COALESCE("מעשר_באחוזים", 0) AS mpercent

    FROM "אברכים"
    WHERE "אברך_id" = $1
    LIMIT 1
SQL;
$maaser_data = queryasrow($sql_maaser, [$avrech_id]);

$mk = 0;
$mp = 0;
if ($maaser_data && is_array($maaser_data)) {
    $mk = round(floatval($maaser_data['mkavua']));
    $mp = round(floatval($maaser_data['mpercent']));


}
$afterMaaser = $sumKolel;
        if ($mk != 0) $afterMaaser -= $mk;
        if ($mp != 0) $afterMaaser *= (1 - $mp / 100);
return $afterMaaser;
}
function israAshray($avrech_id){
    $sql_avrech = 'SELECT "עיר", "קבוצה" FROM "אברכים" WHERE "אברך_id" = $1';
        $res_avrech = queryasrow($sql_avrech, [$avrech_id]);

        $city = trim($res_avrech["עיר"] ?? "");
        $group = trim($res_avrech["קבוצה"] ?? "");
        $isra = 500;

        if ($group === "רבנים" || $city !== "רכסים") {
            $isra = 0;
        }

    return $isra;

}

//-------------------------תשלומים

function save_or_fix_payments($rows) {
    foreach ($rows as $r) {
        $avrech_id = $r["avrech_id"];
        $month = $r["חודש"];
        $year = $r["שנה"];
        $fix_for_month = $r["for_month"]?? null;
        $fix_for_year = $r["for_year"]?? null;
        $maanak = isset($r["maanakIsra"]) ? floatval($r["maanakIsra"]) : 0;
        $fix_type = $r["סוג_תיקון"] ?? null;
      /*  // קבלת נתוני מעשר
        $sql_maaser = <<<SQL
            SELECT 
                COALESCE("מעשר_קבוע", 0) AS mKavua,
                COALESCE("מעשר_באחוזים", 0) AS mPercent
            FROM "אברכים"
            WHERE "אברך_id" = $1
            LIMIT 1
        SQL;
        $maaser_data = queryasrow($sql_maaser, [$avrech_id]);

        $mk = 0;
        $mp = 0;
        if ($maaser_data && is_array($maaser_data)) {
            $mk = round(floatval($maaser_data['mkavua']));
            $mp = round(floatval($maaser_data['mpercent']));
        }/*/
       
        $is_fix = isset($r["is_fix"]) && $r["is_fix"]; // האם תיקון מצטבר

        $base_sum = isset($r["סכום"]) ? floatval($r["סכום"]) : 0;
        $fix_amount = isset($r["סכום_תיקונים"]) ? floatval($r["סכום_תיקונים"]) : 0;
        
        $kolel_sum = isset($r["סכום_כולל"]) ? floatval($r["סכום_כולל"]) : 0;

        $sumTav = isset($r["תווי_קניה_שח"]) ? floatval($r["תווי_קניה_שח"]) : 0;
        $betyitzhak = isset($r["בית_יצחק"]) ? floatval($r["בית_יצחק"]) : 0;
        $betyitzhakPagi = isset($r["בית_יצחק_פאגי"]) ? floatval($r["בית_יצחק_פאגי"]) : 0;
        $gmach = isset($r["גמח_נר_ישראל"]) ? floatval($r["גמח_נר_ישראל"]) : 0;
        
        //$sumTav = $r["תווי_קניה_שח"];
        $shopTav ="";

        $half=$sumTav/2;
       // $betyitzhak = $r["בית_יצחק"];
        //$gmach = $r["גמח_נר_ישראל"];

        // חישוב לאחר מעשר
        /*$afterMaaser = $kolel_sum;
        if ($mk != 0) $afterMaaser -= $mk;
        if ($mp != 0) $afterMaaser *= (1 - $mp / 100);/*/
        $afterMaaser=maaser($r["avrech_id"],$kolel_sum);    
            // קבלת עיר וקבוצה
       /* $sql_avrech = 'SELECT "עיר", "קבוצה" FROM "אברכים" WHERE "אברך_id" = $1';
        $res_avrech = queryasrow($sql_avrech, [$avrech_id]);

        $city = trim($res_avrech["עיר"] ?? "");
        $group = trim($res_avrech["קבוצה"] ?? "");
        $isra = 500;

        if ($group === "רבנים" || $city !== "רכסים") {
            $isra = 0;
            $maanak = 0;
        }/*/
   $isra=israAshray($avrech_id);
  if($isra==0)
    $maanak = 0;

        //$other_pay = $afterMaaser - $isra;
        $other_pay = $afterMaaser - $isra-$betyitzhak-$gmach-$betyitzhakPagi;

   if ($is_fix) {
       
    // קריאה לתיקונים קודמים
    $sql_check = <<<SQL
SELECT "sum"
FROM "תיקונים_רגילים"
WHERE avrech_id = $1 
  AND "חודש" = $2
  AND "שנה" = $3
  AND "חודש_תיקון" = $4
  AND "שנה_תיקון" = $5
LIMIT 1
SQL;

$res_check = queryasrow($sql_check, [$avrech_id, $fix_for_month, $fix_for_year, $month, $year]);

    $sql_tikunim = <<<SQL
        SELECT COALESCE("סכום_תיקונים", 0) AS t
        FROM "תשלומים"
        WHERE avrech_id = $1 AND "חודש" = $2 AND "שנה" = $3
        LIMIT 1
    SQL;
    $t_data = queryasrow($sql_tikunim, [$avrech_id, $month, $year]);
    $previous_fix = round(floatval($t_data['t'] ?? 0));
    if ($fix_type === 'רגיל') {
        if ($res_check) {
            $old_sum = floatval($res_check['sum']);
            $previous_fix -= $old_sum;
    
            $sql_update = <<<SQL
            UPDATE "תיקונים_רגילים"
            SET "sum" = $1
            WHERE avrech_id = $2
              AND "חודש" = $3
              AND "שנה" = $4
              AND "חודש_תיקון" = $5
              AND "שנה_תיקון" = $6
    SQL;
    
            queryasrow($sql_update, [$fix_amount, $avrech_id, $fix_for_month, $fix_for_year, $month, $year]);
    
        } else {
            $sql_insert = <<<SQL
            INSERT INTO "תיקונים_רגילים"
            (avrech_id, "חודש", "שנה", "חודש_תיקון", "שנה_תיקון", "sum")
            VALUES ($1, $2, $3, $4, $5, $6)
    SQL;
    
            queryasrow($sql_insert, [$avrech_id, $fix_for_month, $fix_for_year, $month, $year, $fix_amount]);
        }
    }
    
    
    
    $fix_amount += $previous_fix;

   $kolel_sum += $fix_amount;

    
    $afterMaaser=maaser($r["avrech_id"],$kolel_sum);    

    $isra += $maanak;
    $other_pay = $afterMaaser - $isra-$sumTav-$betyitzhak-$gmach-$betyitzhakPagi;

    $sql = <<<SQL
        INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", "סכום_תיקונים", "סכום_כולל", "ישראשראי", "תשלום_אחר", "סכום_אחר_מעשר")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE SET
            "סכום_תיקונים" = $4,
            "סכום_כולל" = $5,
            "ישראשראי" = $6,
            "תשלום_אחר" = $7,
            "סכום_אחר_מעשר" = $8
            
    SQL;

    $params = [$avrech_id, $month, $year, $fix_amount, $kolel_sum, $isra, $other_pay, $afterMaaser];
} else {

if($sumTav!=0){
$shopTav =$r["חנות_תו"];

$isra-=$half;
$other_pay-=$half;
}
    $extra_fields = "";
    $extra_vals = "";
    $extra_update = "";

    $params = [$avrech_id, $month, $year, $base_sum, $fix_amount, $kolel_sum];
    $param_index = 7;

    if (!is_null($isra)) {
        $extra_fields .= ', ישראשראי';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", ישראשראי = \$$param_index";
        $params[] = $isra;
        $param_index++;
    }

    if (!is_null($other_pay)) {
        $extra_fields .= ', תשלום_אחר';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", תשלום_אחר = \$$param_index";
        $params[] = $other_pay;
        $param_index++;
    }

    if (!is_null($afterMaaser)) {
        $extra_fields .= ', סכום_אחר_מעשר';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", סכום_אחר_מעשר = \$$param_index";
        $params[] = $afterMaaser;
        $param_index++;
    }
    if (!is_null($sumTav)) {
        $extra_fields .= ', תווי_קניה_שח';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", תווי_קניה_שח = \$$param_index";
        $params[] = $sumTav;
        $param_index++;
    }  if (!is_null($shopTav)&&$shopTav!="") {
        $extra_fields .= ', חנות_תו';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", חנות_תו = \$$param_index";
        $params[] = $shopTav;
        $param_index++;
    }
    if (!is_null($betyitzhak)) {
        $extra_fields .= ', בית_יצחק';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", בית_יצחק = \$$param_index";
        $params[] = $betyitzhak;
        $param_index++;
        if (!is_null($betyitzhakPagi)) {
            $extra_fields .= ', בית_יצחק_פאגי';
            $extra_vals .= ", \$$param_index";
            $extra_update .= ", בית_יצחק_פאגי = \$$param_index";
            $params[] = $betyitzhakPagi;
            $param_index++;
    }if (!is_null($gmach)) {
        $extra_fields .= ', גמח_נר_ישראל';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", גמח_נר_ישראל = \$$param_index";
        $params[] = $gmach;
        $param_index++;
    }

    $sql = <<<SQL
        INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", סכום_מבחנים, סכום_תיקונים, סכום_כולל $extra_fields)
        VALUES ($1, $2, $3, $4, $5, $6 $extra_vals)
        ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE SET
            סכום_מבחנים = $4,
            סכום_תיקונים = $5,
            סכום_כולל = $6
            $extra_update
    SQL;
}

error_log("🔄 מבצע שמירה למסד עם השאילתה: $sql");
error_log("🧾 פרמטרים: " . print_r($params, true));

doq($sql, $params);
}

return ["success" => true];
}
}

/*function save_or_fix_payments($rows) {
    foreach ($rows as $r) {
        $avrech_id = $r["avrech_id"];
        $month = $r["חודש"];
        $year = $r["שנה"];
        $fix_for_month = $r["for_month"]?? null;
        $fix_for_year = $r["for_year"]?? null;
        $maanak = isset($r["maanakIsra"]) ? floatval($r["maanakIsra"]) : 0;
        $fix_type = $r["סוג_תיקון"] ?? null;
      /*  // קבלת נתוני מעשר
        $sql_maaser = <<<SQL
            SELECT 
                COALESCE("מעשר_קבוע", 0) AS mKavua,
                COALESCE("מעשר_באחוזים", 0) AS mPercent
            FROM "אברכים"
            WHERE "אברך_id" = $1
            LIMIT 1
        SQL;
        $maaser_data = queryasrow($sql_maaser, [$avrech_id]);

        $mk = 0;
        $mp = 0;
        if ($maaser_data && is_array($maaser_data)) {
            $mk = round(floatval($maaser_data['mkavua']));
            $mp = round(floatval($maaser_data['mpercent']));
        }//
       
        $is_fix = isset($r["is_fix"]) && $r["is_fix"]; // האם תיקון מצטבר

        $base_sum = isset($r["סכום"]) ? floatval($r["סכום"]) : 0;
        $fix_amount = isset($r["סכום_תיקונים"]) ? floatval($r["סכום_תיקונים"]) : 0;
        
        $kolel_sum = isset($r["סכום_כולל"]) ? floatval($r["סכום_כולל"]) : 0;

        $sumTav = isset($r["תווי_קניה_שח"]) ? floatval($r["תווי_קניה_שח"]) : 0;
        $betyitzhak = isset($r["בית_יצחק"]) ? floatval($r["בית_יצחק"]) : 0;
        $betyitzhakPagi = isset($r["בית_יצחק_פאגי"]) ? floatval($r["בית_יצחק_פאגי"]) : 0;
        $gmach = isset($r["גמח_נר_ישראל"]) ? floatval($r["גמח_נר_ישראל"]) : 0;
        
        //$sumTav = $r["תווי_קניה_שח"];
        $shopTav ="";

        $half=$sumTav/2;
       // $betyitzhak = $r["בית_יצחק"];
        //$gmach = $r["גמח_נר_ישראל"];

        // חישוב לאחר מעשר
        /*$afterMaaser = $kolel_sum;
        if ($mk != 0) $afterMaaser -= $mk;
        if ($mp != 0) $afterMaaser *= (1 - $mp / 100);//
        $afterMaaser=maaser($r["avrech_id"],$kolel_sum);    
            // קבלת עיר וקבוצה
       /* $sql_avrech = 'SELECT "עיר", "קבוצה" FROM "אברכים" WHERE "אברך_id" = $1';
        $res_avrech = queryasrow($sql_avrech, [$avrech_id]);

        $city = trim($res_avrech["עיר"] ?? "");
        $group = trim($res_avrech["קבוצה"] ?? "");
        $isra = 500;

        if ($group === "רבנים" || $city !== "רכסים") {
            $isra = 0;
            $maanak = 0;
        }//
   $isra=israAshray($avrech_id);
  if($isra==0)
    $maanak = 0;

        //$other_pay = $afterMaaser - $isra;
        $other_pay = $afterMaaser - $isra-$betyitzhak-$gmach-$betyitzhakPagi;

   if ($is_fix) {
       
    // קריאה לתיקונים קודמים
    $sql_check = <<<SQL
SELECT "sum"
FROM "תיקונים_רגילים"
WHERE avrech_id = $1 
  AND "חודש" = $2
  AND "שנה" = $3
  AND "חודש_תיקון" = $4
  AND "שנה_תיקון" = $5
LIMIT 1
SQL;

$res_check = queryasrow($sql_check, [$avrech_id, $fix_for_month, $fix_for_year, $month, $year]);

    $sql_tikunim = <<<SQL
        SELECT COALESCE("סכום_תיקונים", 0) AS t
        FROM "תשלומים"
        WHERE avrech_id = $1 AND "חודש" = $2 AND "שנה" = $3
        LIMIT 1
    SQL;
    $t_data = queryasrow($sql_tikunim, [$avrech_id, $month, $year]);
    $previous_fix = round(floatval($t_data['t'] ?? 0));
    if ($fix_type === 'רגיל') {
        if ($res_check) {
            $old_sum = floatval($res_check['sum']);
            $previous_fix -= $old_sum;
    
            $sql_update = <<<SQL
            UPDATE "תיקונים_רגילים"
            SET "sum" = $1
            WHERE avrech_id = $2
              AND "חודש" = $3
              AND "שנה" = $4
              AND "חודש_תיקון" = $5
              AND "שנה_תיקון" = $6
    SQL;
    
            queryasrow($sql_update, [$fix_amount, $avrech_id, $fix_for_month, $fix_for_year, $month, $year]);
    
        } else {
            $sql_insert = <<<SQL
            INSERT INTO "תיקונים_רגילים"
            (avrech_id, "חודש", "שנה", "חודש_תיקון", "שנה_תיקון", "sum")
            VALUES ($1, $2, $3, $4, $5, $6)
    SQL;
    
            queryasrow($sql_insert, [$avrech_id, $fix_for_month, $fix_for_year, $month, $year, $fix_amount]);
        }
    }
    
    
    
    $fix_amount += $previous_fix;

   $kolel_sum += $fix_amount;

    
    $afterMaaser=maaser($r["avrech_id"],$kolel_sum);    

    $isra += $maanak;
    $other_pay = $afterMaaser - $isra-$sumTav-$betyitzhak-$gmach-$betyitzhakPagi;

    $sql = <<<SQL
        INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", "סכום_תיקונים", "סכום_כולל", "ישראשראי", "תשלום_אחר", "סכום_אחר_מעשר")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE SET
            "סכום_תיקונים" = $4,
            "סכום_כולל" = $5,
            "ישראשראי" = $6,
            "תשלום_אחר" = $7,
            "סכום_אחר_מעשר" = $8
            
    SQL;

    $params = [$avrech_id, $month, $year, $fix_amount, $kolel_sum, $isra, $other_pay, $afterMaaser];
} else {

if($sumTav!=0){
$shopTav =$r["חנות_תו"];

$isra-=$half;
$other_pay-=$half;
}
    $extra_fields = "";
    $extra_vals = "";
    $extra_update = "";

    $params = [$avrech_id, $month, $year, $base_sum, $fix_amount, $kolel_sum];
    $param_index = 7;

    if (!is_null($isra)) {
        $extra_fields .= ', ישראשראי';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", ישראשראי = \$$param_index";
        $params[] = $isra;
        $param_index++;
    }

    if (!is_null($other_pay)) {
        $extra_fields .= ', תשלום_אחר';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", תשלום_אחר = \$$param_index";
        $params[] = $other_pay;
        $param_index++;
    }

    if (!is_null($afterMaaser)) {
        $extra_fields .= ', סכום_אחר_מעשר';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", סכום_אחר_מעשר = \$$param_index";
        $params[] = $afterMaaser;
        $param_index++;
    }
    if (!is_null($sumTav)) {
        $extra_fields .= ', תווי_קניה_שח';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", תווי_קניה_שח = \$$param_index";
        $params[] = $sumTav;
        $param_index++;
    }  if (!is_null($shopTav)&&$shopTav!="") {
        $extra_fields .= ', חנות_תו';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", חנות_תו = \$$param_index";
        $params[] = $shopTav;
        $param_index++;
    }
    if (!is_null($betyitzhak)) {
        $extra_fields .= ', בית_יצחק';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", בית_יצחק = \$$param_index";
        $params[] = $betyitzhak;
        $param_index++;
        if (!is_null($betyitzhakPagi)) {
            $extra_fields .= ', בית_יצחק_פאגי';
            $extra_vals .= ", \$$param_index";
            $extra_update .= ", בית_יצחק_פאגי = \$$param_index";
            $params[] = $betyitzhakPagi;
            $param_index++;
    }if (!is_null($gmach)) {
        $extra_fields .= ', גמח_נר_ישראל';
        $extra_vals .= ", \$$param_index";
        $extra_update .= ", גמח_נר_ישראל = \$$param_index";
        $params[] = $gmach;
        $param_index++;
    }

    $sql = <<<SQL
        INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", סכום_מבחנים, סכום_תיקונים, סכום_כולל $extra_fields)
        VALUES ($1, $2, $3, $4, $5, $6 $extra_vals)
        ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE SET
            סכום_מבחנים = $4,
            סכום_תיקונים = $5,
            סכום_כולל = $6
            $extra_update
    SQL;
}

error_log("🔄 מבצע שמירה למסד עם השאילתה: $sql");
error_log("🧾 פרמטרים: " . print_r($params, true));

doq($sql, $params);
}

return ["success" => true];
}
}
*/



//========================תווי קניה
function get_tav_kniya_kvuim() {
    return queryasarray("SELECT * FROM תווי_קניה_קבועים WHERE פעיל = TRUE");
}
  
/*function save_tav_kniya_kavua($p) {

    $kod = intval($p["אברך_id"]);
    $s = intval($p["סכום"]);
    $h = $p["חנות"];
    $active = $p["פעיל"] ? 'TRUE' : 'FALSE';
  
    $existing = queryasarray("SELECT 1 FROM תווי_קניה_קבועים WHERE אברך_id = $1", [$kod]);
  
    if ($existing) {
      doq("UPDATE תווי_קניה_קבועים SET חנות = $1, סכום = $2, פעיל = $3 WHERE אברך_id = $4", [$h, $s, $active, $kod]);
    } else {
      doq("INSERT INTO תווי_קניה_קבועים (אברך_id, חנות, סכום, פעיל) VALUES ($1, $2, $3, $4)", [$kod, $h, $s, $active]);
    }
}*/
function save_fixed_tavim($p) {

    $kod = intval($p["avrech_id"]);
    $s = intval($p["amount"]);
    $h = $p["store"];
    $active = 'TRUE';
  
    $existing = queryasarray("SELECT 1 FROM תווי_קניה_קבועים WHERE אברך_id = $1", [$kod]);
  
    if ($existing) {
      doq("UPDATE תווי_קניה_קבועים SET חנות = $1, סכום = $2, פעיל = $3 WHERE אברך_id = $4", [$h, $s, $active, $kod]);
    } else {
      doq("INSERT INTO תווי_קניה_קבועים (אברך_id, חנות, סכום, פעיל) VALUES ($1, $2, $3, $4)", [$kod, $h, $s, $active]);
    }
    header('Content-Type: application/json');
    ob_clean(); // 🧽 נקה פלט קודם
    echo json_encode(["success" => true]);
    exit; 

}
//שמירה בתווי קניה קבועים
/*function save_fixed_tavim($p) {
    $avrech_id = $p["avrech_id"];
    $amount = $p["amount"];
    $store = $p["store"];

    if (!$avrech_id || !$amount || !$store) {
        throw new Exception("Missing parameters");
    }

    doq("INSERT INTO תווי_קניה_קבועים (אברך_id, סכום, חנות)
         VALUES ($1, $2, $3)
         ON CONFLICT (אברך_id) DO UPDATE SET
         סכום = EXCLUDED.amount,
         חנות = EXCLUDED.store",
         [$avrech_id, $amount, $store]);
}*/


/*function update_deposits_from_payments($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;

    if (!$month || !$year) return ["success" => false, "error" => "חסר חודש או שנה"];

    // שליפת כל התשלומים עבור החודש והשנה
    $payments = queryasarray("
        SELECT avrech_id, תשלום_אחר,בית_יצחק_פאגי ,בית_יצחק, גמח_נר_ישראל
        FROM תשלומים
        WHERE חודש = $1 AND שנה = $2
    ", [$month, $year]);

    foreach ($payments as $pmt) {
        $avrech_id = $pmt["avrech_id"];
        $sumNY = ($pmt["תשלום_אחר"] ?? 0);
        $sumBY = ($pmt["בית_יצחק"] ?? 0);
        $sumBYP = ($pmt["בית_יצחק_פאגי"] ?? 0);

        $sumGNY = ($pmt["גמח_נר_ישראל"] ?? 0);
        var_dump($sumNY, $sumBY, $sumGNY);

        $existing = queryasrow("SELECT 1 FROM פעימות WHERE avrech_id = $1", [$avrech_id]);

        if ($existing) {
            // עדכון שורה קיימת לכל המקורות
            doq("UPDATE פעימות SET 
                sum_ner_yisrael=$1, hefresh_ner_yisrael=$1,
                sum_beit_yitzchak=$2, hefresh_beit_yitzchak=$2,
                sum_gmach_ner_yisrael=$3, hefresh_gmach_ner_yisrael=$3,
                sum_beit_yitzchak_pagi=$4, hefresh_beit_yitzchak_pagi=$4
                WHERE avrech_id=$5",
                [$sumNY, $sumBY, $sumGNY,$sumBYP, $avrech_id]);
        } else {
            // הכנסת שורה חדשה עם כל המקורות
            doq("INSERT INTO פעימות 
                (avrech_id, sum_ner_yisrael, hefresh_ner_yisrael,
                 sum_beit_yitzchak, hefresh_beit_yitzchak,
                 sum_gmach_ner_yisrael, hefresh_gmach_ner_yisrael,
                 sum_beit_yitzchak_pagi, hefresh_beit_yitzchak_pagi)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                [$avrech_id, $sumNY, $sumNY, $sumBY, $sumBY, $sumGNY, $sumGNY, $sumBYP, $sumBYP]);
        }
    }

    // לאחר יצירת הפקדה ראשונה, אפשר לקרוא את create_masav עבור החודש והשנה
    //create_masav($month, $year);
    create_masav_files($month, $year);

    return ["success" => true];
}*/
function update_deposits_from_payments($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;

    if (!$month || !$year) {
        return ["success" => false, "error" => "חסר חודש או שנה"];
    }

    // שליפת כל התשלומים עבור החודש והשנה
    $payments = queryasarray("
        SELECT avrech_id, תשלום_אחר, בית_יצחק_פאגי, בית_יצחק, גמח_נר_ישראל
        FROM תשלומים
        WHERE חודש = $1 AND שנה = $2
    ", [$month, $year]);

    foreach ($payments as $pmt) {
        $avrech_id = $pmt["avrech_id"];
        $sumNY = ($pmt["תשלום_אחר"] ?? 0);
        $sumBY = ($pmt["בית_יצחק"] ?? 0);
        $sumBYP = ($pmt["בית_יצחק_פאגי"] ?? 0);
        $sumGNY = ($pmt["גמח_נר_ישראל"] ?? 0);

        // בדיקה אם כבר קיימת פעימה עבור האברך
        $existing = queryasrow("SELECT 1 FROM פעימות WHERE avrech_id = $1", [$avrech_id]);

        if ($existing) {
            // עדכון שורה קיימת לכל המקורות
            doq("UPDATE פעימות SET 
                sum_ner_yisrael=$1, hefresh_ner_yisrael=$1,
                sum_beit_yitzchak=$2, hefresh_beit_yitzchak=$2,
                sum_gmach_ner_yisrael=$3, hefresh_gmach_ner_yisrael=$3,
                sum_beit_yitzchak_pagi=$4, hefresh_beit_yitzchak_pagi=$4
                WHERE avrech_id=$5",
                [$sumNY, $sumBY, $sumGNY, $sumBYP, $avrech_id]);
        } else {
            // הכנסת שורה חדשה עם כל המקורות
            doq("INSERT INTO פעימות 
                (avrech_id, sum_ner_yisrael, hefresh_ner_yisrael,
                 sum_beit_yitzchak, hefresh_beit_yitzchak,
                 sum_gmach_ner_yisrael, hefresh_gmach_ner_yisrael,
                 sum_beit_yitzchak_pagi, hefresh_beit_yitzchak_pagi)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                [$avrech_id, $sumNY, $sumNY, $sumBY, $sumBY, $sumGNY, $sumGNY, $sumBYP, $sumBYP]);
        }
    }

    // יצירת קבצי מס"ב לאחר הזנת הפקדות
    create_masav_files($month, $year);

    // החזרת JSON תקין ל-JS
    return ["success" => true];
}

/*function other_deposit($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;

    if (!$month || !$year) {
        return ["success" => false, "error" => "חסר חודש או שנה"];
    }

    // שליפת סכומים מעודכנים לפי חודש ושנה
    $updatedSums = queryasarray("
        SELECT avrech_id, סכום_אחר_מעשר
        FROM תשלומים
        WHERE חודש = $1 AND שנה = $2
    ", [$month, $year]);

    foreach ($updatedSums as $row) {
        $avrech_id = $row["avrech_id"];
        $new_sum = floatval($row["סכום_אחר_מעשר"]);

        // שליפת הסכום הנוכחי מהטבלה פעימות
        $existing = queryasrow("SELECT sum FROM פעימות WHERE avrech_id = $1", [$avrech_id]);

        if ($existing) {
            $old_sum = floatval($existing["sum"]);
            $hefresh = $new_sum - $old_sum;

            // עדכון השורה בטבלת פעימות
            doq('UPDATE "פעימות" SET sum = $1, hefresh = $2 WHERE avrech_id = $3', [$new_sum, $hefresh, $avrech_id]);
        }
    }

    return ["success" => true];
}*/
function other_deposit($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;

    if (!$month || !$year) return ["success" => false, "error" => "חסר חודש או שנה"];

    // שליפת הסכומים המעודכנים מהתשלומים
    $payments = queryasarray("
        SELECT avrech_id, תשלום_אחר,בית_יצחק_פאגי, בית_יצחק, גמח_נר_ישראל
        FROM תשלומים
        WHERE חודש = $1 AND שנה = $2
    ", [$month, $year]);

    foreach ($payments as $pmt) {
        $avrech_id = $pmt["avrech_id"];
        $newNY = ($pmt["תשלום_אחר"] ?? 0);
        $newBY = ($pmt["בית_יצחק"] ?? 0);
        $newBYP = ($pmt["בית_יצחק_פאגי"] ?? 0);

        $newGNY = ($pmt["גמח_נר_ישראל"] ?? 0);

        $existing = queryasrow("SELECT * FROM פעימות WHERE avrech_id=$1", [$avrech_id]);

        if ($existing) {
            // מחשבים הפרשים מול הסכומים הקודמים
            $hefreshNY = $newNY - floatval($existing["sum_ner_yisrael"]);
            $hefreshBY = $newBY - floatval($existing["sum_beit_yitzchak"]);
            $hefreshBYP = $newBYP - floatval($existing["sum_beit_yitzchak_pagi"]);

            $hefreshGNY = $newGNY - floatval($existing["sum_gmach_ner_yisrael"]);

            // עדכון הטבלה
            doq("UPDATE פעימות SET 
                sum_ner_yisrael=$1, hefresh_ner_yisrael=$2,
                sum_beit_yitzchak=$3, hefresh_beit_yitzchak=$4,
                sum_gmach_ner_yisrael=$5, hefresh_gmach_ner_yisrael=$6,
                sum_beit_yitzchak_pagi=$7, hefresh_beit_yitzchak_pagi=$8
                WHERE avrech_id=$9",
                [$newNY, $hefreshNY, $newBY, $hefreshBY, $newGNY, $hefreshGNY,$newBYP,$hefreshBYP, $avrech_id]);
        }
    }

    // עכשיו נוצרים קבצי מס"ב על בסיס ההפרשים
   // create_masav($month, $year);
   create_masav_files($month, $year);

    return ["success" => true];
}


function createMilga($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;
    $prevMonths = $p["prevMonths"] ?? [];

    if (!$month || !$year) {
        return ["success" => false, "error" => "חסר חודש או שנה"];
    }

    $specialMonths = ["תשרי" => 0.75, "אב" => 0.75, "ניסן" => 1];
    $factor = $specialMonths[$month] ?? 0;
    
    if ($factor !=0 && !empty($prevMonths)) {

        // המרה של prevMonths לשנה עברית כפי שמופיעה במסד
        $prevMonthsHeb = [];
        foreach ($prevMonths as $m) {
            list($monthName, $yearNum) = explode('/', $m); // מפריד לחודש ולשנה לועזית
            // כאן מניחים שיש פונקציה קיימת שמחזירה את השנה בעברית ממספר לועזי
            $heYear = $yearNum; // אם השנה כבר עברית מטופס, אפשר להשאיר כמו שהיא
            $prevMonthsHeb[] = $monthName . '/' . $heYear;
        }
    
        // יצירת מערך Postgres
        $pgArray = '{' . implode(',', array_map(fn($v) => '"' . $v . '"', $prevMonthsHeb)) . '}';
    
        // בדיקה בלוג
        error_log("PrevMonthsHeb array: " . json_encode($prevMonthsHeb));
        error_log("PG Array: $pgArray");
    
        $avgSql = <<<SQL
            SELECT avrech_id, AVG("בסיס" + "שמירת_סדרים") AS avg_amount
            FROM "תשלומים"
            WHERE ("חודש" || '/' || "שנה") = ANY($1::text[])
            GROUP BY avrech_id
        SQL;
    
        $avgRows = queryasarray($avgSql, [$pgArray]);
        error_log("AvgRows: " . json_encode($avgRows));
    
        if (empty($avgRows)) {
            error_log("No avgRows found for prevMonthsHeb: " . json_encode($prevMonthsHeb));
        }
    
        foreach ($avgRows as $row) {
            $avrech = $row['avrech_id'];
            $avgAmount = $row['avg_amount'] * $factor;
            $tavSql = <<<SQL
            SELECT סכום, חנות
            FROM "תווי_קניה_קבועים"
            WHERE "אברך_id" = $1 AND "פעיל" = TRUE
            LIMIT 1
            SQL;
            $tavRow = queryasarray($tavSql, [$avrech]);
            $tav = $tavRow[0] ?? ['סכום' => null, 'חנות' => null];

            $isra=israAshray($avrech);
            
            $existingSql = <<<SQL
           SELECT 
    COALESCE(h.base,0) AS base,
    COALESCE(h.sm,0) AS sm,
    COALESCE(h."sdarim_Z_sum",0) AS sdarim_z_sum


FROM h_to_office h
JOIN "אברכים" a ON a."תז" = h."tz"
WHERE a."אברך_id" = $1
  AND h.m = $2 
  AND h.y = $3 
SQL;

$existingRows = queryasarray($existingSql, [$avrech, $month, $year]);
$existingRow = $existingRows[0] ?? ['base'=>0,'sm'=>0,'sdarim_Z_sum'=>0];

$total = $avgAmount 
       + ($existingRow['sm'] ?? 0) ;
/*$total = $avgAmount 
       + ($existingRow['base'] ?? 0) 
       + ($existingRow['sm'] ?? 0) 
       + ($existingRow['sdarim_z_sum'] ?? 0);*/
   $afterMaaser= maaser($avrech,$total);
   $payNY=$afterMaaser;
   $payNY-=$isra;
   if($tav['סכום']!=null&&$isra)
   {
       $half=$tav['סכום']/2;
       $payNY-=$half;
       $isra-=$half;
   }
   

            $insertSql = <<<SQL
INSERT INTO "תשלומים"
(avrech_id,"חודש","שנה", סכום_כולל, בסיס, שמירת_סדרים, סך_סדר_זכאי, סכום_אחר_מעשר,
 "תווי_קניה_שח", "חנות_תו",תשלום_אחר,ישראשראי)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE
SET סכום_כולל = EXCLUDED.סכום_כולל,
    בסיס = EXCLUDED.בסיס,
    שמירת_סדרים = EXCLUDED.שמירת_סדרים,
    סך_סדר_זכאי = EXCLUDED.סך_סדר_זכאי,
    סכום_אחר_מעשר = EXCLUDED.סכום_אחר_מעשר,
    "תווי_קניה_שח" = COALESCE("תשלומים"."תווי_קניה_שח", EXCLUDED."תווי_קניה_שח"),
    "חנות_תו" = COALESCE("תשלומים"."חנות_תו", EXCLUDED."חנות_תו"),
    תשלום_אחר = EXCLUDED.תשלום_אחר,
    ישראשראי = EXCLUDED.ישראשראי;

SQL;

doq($insertSql, [$avrech, $month, $year, $total, $existingRow['base'] ?? 0,
$existingRow['sm'] ?? 0,
$existingRow['sdarim_z_sum'] ?? 0,$afterMaaser, $tav['סכום'], $tav['חנות'],$payNY,$isra]);
  
        }
    }
    else {
        // חישוב רגיל לחודשים שאינם מיוחדים
   

// שלב 1: שולפים את הנתונים מהטבלה h_to_office
$sql = <<<SQL
SELECT 
    a."אברך_id" AS avrech_id,
    COALESCE(h.base, 0) AS base,
    COALESCE(h.sm, 0) AS sm,
    COALESCE(h."sdarim_Z_sum", 0) AS sdarim_z_sum
FROM "h_to_office" h
JOIN "אברכים" a ON a."תז" = h."tz"
/*WHERE h.m = $1 AND h.y = $2*/
SQL;

//$rows = queryasarray($sql, [$month, $year]);
$rows = queryasarray($sql);

// שלב 2: לולאה על כל הרשומות
foreach ($rows as $r) {
    $avrech_id = $r['avrech_id'];
    $base      = $r['base'];
    $sm        = $r['sm'];
    $sdarim    = $r['sdarim_z_sum'];

    // חישוב סכום כולל
    $total = $base + $sm + $sdarim;

    // קריאה לפונקציית המעשר שלך
    $afterMaaser = maaser($avrech_id, $total);

    $isra=israAshray($avrech_id);

    $payNY=$afterMaaser;
    $payNY-=$isra;

    $tavSql = <<<SQL
    SELECT סכום, חנות
    FROM "תווי_קניה_קבועים"
    WHERE "אברך_id" = $1 AND "פעיל" = TRUE
    LIMIT 1
    SQL;
    $tavRow = queryasarray($tavSql, [$avrech_id]);
    $tav = $tavRow[0] ?? ['סכום' => null, 'חנות' => null];
    if($tav['סכום']!=null&&$isra)
    {
        $half=$tav['סכום']/2;
        $payNY-=$half;
        $isra-=$half;
    }
    // שלב 3: הכנסת/עדכון בטבלת תשלומים
    $insertSql = <<<SQL
    INSERT INTO "תשלומים"
    (avrech_id,"חודש","שנה", סכום_כולל, בסיס, שמירת_סדרים, סך_סדר_זכאי, סכום_אחר_מעשר,"תווי_קניה_שח", "חנות_תו",תשלום_אחר,ישראשראי)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE
    SET סכום_כולל = EXCLUDED.סכום_כולל,
        בסיס = EXCLUDED.בסיס,
        שמירת_סדרים = EXCLUDED.שמירת_סדרים,
        סך_סדר_זכאי = EXCLUDED.סך_סדר_זכאי,
        סכום_אחר_מעשר = EXCLUDED.סכום_אחר_מעשר,
        "תווי_קניה_שח" = COALESCE("תשלומים"."תווי_קניה_שח", EXCLUDED."תווי_קניה_שח"),
    "חנות_תו" = COALESCE("תשלומים"."חנות_תו", EXCLUDED."חנות_תו"),
    תשלום_אחר = EXCLUDED.תשלום_אחר,
    ישראשראי = EXCLUDED.ישראשראי;
    SQL;

    doq($insertSql, [$avrech_id, $month, $year, $total, $base, $sm, $sdarim, $afterMaaser,$tav['סכום'], $tav['חנות'],$payNY,$isra]);
}
}

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["success" => true, "message" => "נוצרו נתוני מלגה בהצלחה"]);
    exit;
}
/*function createMilga($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;
    $prevMonths = $p["prevMonths"] ?? [];

    if (!$month || !$year) {
        return ["success" => false, "error" => "חסר חודש או שנה"];
    }

    $specialMonths = ["תשרי" => 0.75, "אב" => 0.75, "ניסן" => 1];
    $factor = $specialMonths[$month] ?? 0;

    if ($factor !=0 && !empty($prevMonths)) {

        // המרה של prevMonths לשנה עברית כפי שמופיעה במסד
        $prevMonthsHeb = [];
        foreach ($prevMonths as $m) {
            list($monthName, $yearNum) = explode('/', $m); // מפריד לחודש ולשנה לועזית
            // כאן מניחים שיש פונקציה קיימת שמחזירה את השנה בעברית ממספר לועזי
            $heYear = $yearNum; // אם השנה כבר עברית מטופס, אפשר להשאיר כמו שהיא
            $prevMonthsHeb[] = $monthName . '/' . $heYear;
        }
    
        // יצירת מערך Postgres
        $pgArray = '{' . implode(',', array_map(fn($v) => '"' . $v . '"', $prevMonthsHeb)) . '}';
    
        // בדיקה בלוג
        error_log("PrevMonthsHeb array: " . json_encode($prevMonthsHeb));
        error_log("PG Array: $pgArray");
    
        $avgSql = <<<SQL
            SELECT avrech_id, AVG("בסיס" + "שמירת_סדרים") AS avg_amount
            FROM "תשלומים"
            WHERE ("חודש" || '/' || "שנה") = ANY($1::text[])
            GROUP BY avrech_id
        SQL;
    
        $avgRows = queryasarray($avgSql, [$pgArray]);
        error_log("AvgRows: " . json_encode($avgRows));
    
        if (empty($avgRows)) {
            error_log("No avgRows found for prevMonthsHeb: " . json_encode($prevMonthsHeb));
        }
    
        foreach ($avgRows as $row) {
            $avrech = $row['avrech_id'];
            $avgAmount = $row['avg_amount'] * $factor;
    
            $existingSql = <<<SQL
           SELECT 
    COALESCE(h.base,0) AS base,
    COALESCE(h.sm,0) AS sm,
    COALESCE(h."sdarim_Z_sum",0) AS sdarim_z_sum


FROM h_to_office h
JOIN "אברכים" a ON a."תז" = h."tz"
WHERE a."אברך_id" = $1
  AND h.m = $2 
  AND h.y = $3 
SQL;

$existingRows = queryasarray($existingSql, [$avrech, $month, $year]);
$existingRow = $existingRows[0] ?? ['base'=>0,'sm'=>0,'sdarim_Z_sum'=>0];

$total = $avgAmount 
       + ($existingRow['sm'] ?? 0) ;
/*$total = $avgAmount 
       + ($existingRow['base'] ?? 0) 
       + ($existingRow['sm'] ?? 0) 
       + ($existingRow['sdarim_z_sum'] ?? 0);//
       $afterMaaser= maaser($avrech,$total);
       $insertSql = <<<SQL
INSERT INTO "תשלומים" (avrech_id,"חודש","שנה",סכום_כולל, בסיס, שמירת_סדרים, סך_סדר_זכאי,סכום_אחר_מעשר)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE
SET סכום_כולל = EXCLUDED.סכום_כולל,
בסיס = EXCLUDED.בסיס,
שמירת_סדרים = EXCLUDED.שמירת_סדרים,
סך_סדר_זכאי = EXCLUDED.סך_סדר_זכאי;
SQL;

doq($insertSql, [$avrech, $month, $year, $total, $existingRow['base'] ?? 0,
$existingRow['sm'] ?? 0,
$existingRow['sdarim_z_sum'] ?? 0,$afterMaaser]);

   }
}
else {
   // חישוב רגיל לחודשים שאינם מיוחדים


// שלב 1: שולפים את הנתונים מהטבלה h_to_office
$sql = <<<SQL
SELECT 
a."אברך_id" AS avrech_id,
COALESCE(h.base, 0) AS base,
COALESCE(h.sm, 0) AS sm,
COALESCE(h."sdarim_Z_sum", 0) AS sdarim_z_sum
FROM "h_to_office" h
JOIN "אברכים" a ON a."תז" = h."tz"
/*WHERE h.m = $1 AND h.y = $2//
SQL;

//$rows = queryasarray($sql, [$month, $year]);
$rows = queryasarray($sql);

// שלב 2: לולאה על כל הרשומות
foreach ($rows as $r) {
$avrech_id = $r['avrech_id'];
$base      = $r['base'];
$sm        = $r['sm'];
$sdarim    = $r['sdarim_z_sum'];

// חישוב סכום כולל
$total = $base + $sm + $sdarim;

// קריאה לפונקציית המעשר שלך
$afterMaaser = maaser($avrech_id, $total);

// שלב 3: הכנסת/עדכון בטבלת תשלומים
$insertSql = <<<SQL
INSERT INTO "תשלומים"
(avrech_id,"חודש","שנה", סכום_כולל, בסיס, שמירת_סדרים, סך_סדר_זכאי, סכום_אחר_מעשר)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (avrech_id, "חודש", "שנה") DO UPDATE
SET סכום_כולל = EXCLUDED.סכום_כולל,
   בסיס = EXCLUDED.בסיס,
   שמירת_סדרים = EXCLUDED.שמירת_סדרים,
   סך_סדר_זכאי = EXCLUDED.סך_סדר_זכאי,
   סכום_אחר_מעשר = EXCLUDED.סכום_אחר_מעשר;
SQL;

doq($insertSql, [$avrech_id, $month, $year, $total, $base, $sm, $sdarim, $afterMaaser]);
}
}
//   
else {
   // חישוב רגיל לחודשים שאינם מיוחדים
   $sql = <<<SQL
       INSERT INTO "תשלומים" (avrech_id, "חודש", "שנה", סכום_כולל, בסיס, שמירת_סדרים, סך_סדר_זכאי)
       SELECT 
           a."אברך_id", 
           $1 AS "חודש", 
           $2 AS "שנה", 
           (COALESCE(h.base, 0) + COALESCE(h.sm, 0) + COALESCE(h."sdarim_Z_sum", 0)) AS סכום_כולל,
           COALESCE(h.base, 0) AS בסיס,
           COALESCE(h.sm, 0) AS שמירת_סדרים,
           COALESCE(h."sdarim_Z_sum", 0) AS סך_סדר_זכאי
       FROM "h_to_office" h
       JOIN "אברכים" a ON a."תז" = h."tz"
       WHERE NOT EXISTS (
           SELECT 1 FROM "תשלומים" t 
           WHERE t.avrech_id = a."אברך_id" AND t."חודש" = $1 AND t."שנה" = $2 AND h.m=$1 AND h.y=$2
       )
   SQL;

   doq($sql, [$month, $year]);
}//

header('Content-Type: application/json; charset=utf-8');
echo json_encode(["success" => true, "message" => "נוצרו נתוני מלגה בהצלחה"]);
exit;
}
*/

function applyGeneralDepositToTashlumim($p) {
    $month = $p["חודש"] ?? null;
    $year = $p["שנה"] ?? null;
    $source = $p["מקור"] ?? null;
    $amount = $p["סכום"] ?? null;

    if (!$month || !$year || !$source || $amount === null) {
        return ["success" => false, "error" => "חסרים נתונים (חודש/שנה/מקור/סכום)"];
    }

    if (!in_array($source, ["בית_יצחק", "גמח_נר_ישראל", "בית_יצחק_פאגי"])) {
        return ["success" => false, "error" => "מקור לא תקין"];
    }

    $sql = <<<SQL
        UPDATE "תשלומים"
        SET 
            "תשלום_אחר" = COALESCE("תשלום_אחר", 0) - \$3,
            "$source" =\$3
        WHERE "חודש" = \$1 AND "שנה" = \$2
    SQL;

    doq($sql, [$month, $year, $amount]);

    return ["success" => true, "message" => "הפקדה כללית עודכנה בהצלחה"];
}


function get_masav_rows($month, $year, $dbField) {
    file_put_contents(
        "C:/xampp/htdocs/dev_s/masav/debug.txt",
        "INSIDE get_masav_rows for $dbField\n",
        FILE_APPEND
    );

    $rows = queryasarray("
        SELECT
            a.בנק,
            a.סניף,
            a.חשבון,
            a.תז,
            (a.משפחה || ' ' || a.פרטי) AS שם,
            p.$dbField AS סכום,
            p.avrech_id AS id
        FROM פעימות p
        JOIN אברכים a ON a.אברך_id = p.avrech_id
        WHERE p.$dbField <> 0
    ");

    file_put_contents(
        "C:/xampp/htdocs/dev_s/masav/debug.txt",
        "ROWS count: " . count($rows) . "\n",
        FILE_APPEND
    );

    return $rows;
}



function create_masav_files($month, $year) {

    $debugFile = "C:/xampp/htdocs/dev_s/masav/debug.txt";

    file_put_contents(
        $debugFile,
        "create_masav_files CALLED for $month $year\n",
        FILE_APPEND
    );

    $sources = require __DIR__ . '/masav_sources.php';

    foreach ($sources as $key => $src) {

        file_put_contents(
            $debugFile,
            "source: {$key}\n",
            FILE_APPEND
        );
        file_put_contents(
            "C:/xampp/htdocs/dev_s/masav/debug.txt",
            "BEFORE get_masav_rows\n",
            FILE_APPEND
        );
        
        $rows = get_masav_rows($month, $year, $src['db_field']);
        file_put_contents(
            "C:/xampp/htdocs/dev_s/masav/debug.txt",
            "AFTER get_masav_rows\n",
            FILE_APPEND
        );
        
        // 🔍 בדיקה מפורשת
        if (empty($rows)) {
            file_put_contents(
                $debugFile,
                "SKIPPED {$key} – no rows returned\n",
                FILE_APPEND
            );
            continue;
        }

        file_put_contents(
            $debugFile,
            "rows count for {$key}: " . count($rows) . "\n",
            FILE_APPEND
        );

        // שולחים ל־JS שיבנה את המס"ב
        $payload = [
            'institution_code' => $src['institution_code'],
            'institution_name' => $src['institution_name'],
            'rows' => $rows
        ];

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $tmp  = tempnam(sys_get_temp_dir(), 'masav_');
        file_put_contents($tmp, $json);

        $node   = 'node';
        $script = 'C:\\xampp\\htdocs\\dev_s\\js\\masav_builder.js';

        $cmd = "$node \"$script\" \"$tmp\"";

        file_put_contents(
            $debugFile,
            "RUNNING: $cmd\n",
            FILE_APPEND
        );

        $output = shell_exec($cmd);

        file_put_contents(
            $debugFile,
            "node output length: " . strlen((string)$output) . "\n",
            FILE_APPEND
        );

        if (empty($output)) {
            file_put_contents(
                $debugFile,
                "ERROR: node returned empty output for {$key}\n",
                FILE_APPEND
            );
            continue;
        }

        $outDir = "C:/xampp/htdocs/dev_s/masav";
        if (!is_dir($outDir)) {
            mkdir($outDir, 0777, true);
        }

        $filename = "{$outDir}/{$key}_{$year}_{$month}.001";
        file_put_contents($filename, $output);

        file_put_contents(
            $debugFile,
            "CREATED FILE: {$filename}\n",
            FILE_APPEND
        );
    }

    return ["success" => true];
}

