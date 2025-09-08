<?php
// ------------------------
// קובץ: avrechim.php
// ------------------------

include_once 'dbq.php';

function getall_av($p)
{
    $sql = 'SELECT * FROM אברכים WHERE משפחה IS NOT NULL ORDER BY משפחה, פרטי LIMIT 3000';
    return queryasarray($sql);
}

function get_av_by_snif($p) {
    $snif_id = $p['snif_id'] ?? null;
    if (!$snif_id) return [];

    $sql = 'SELECT a.*
            FROM "אברכים" a
            JOIN "קבוצות" k ON a."קבוצה" = k."שם"
            WHERE k."מספר" = $1
              AND a."משפחה" IS NOT NULL
            ORDER BY a."משפחה", a."פרטי"
            LIMIT 3000';

    return queryasarray($sql, [$snif_id]);
}

function get_av_by_snif_group($p) {
    $snif_id = $p['snif_id'] ?? null;
    $group_num = $p['group_num'] ?? null;
    if (!$snif_id) return [];

    if ($group_num) {
        $sql = 'SELECT a.* FROM "אברכים" a
                JOIN "קבוצות" k ON a."קבוצה" = k."שם"
                WHERE k."מספר" = $1
                AND a."משפחה" IS NOT NULL
                ORDER BY a."משפחה", a."פרטי"
                LIMIT 3000';
        return queryasarray($sql, [$group_num]);
    } else {
        $sql = 'SELECT * FROM "אברכים" WHERE "משפחה" IS NOT NULL ORDER BY "משפחה", "פרטי" LIMIT 3000';
        return queryasarray($sql);
    }
}

function get_av_filtered($p) {
    $snif_id = $p['snif_id'] ?? null;
    $group_name = $p['group_name'] ?? null;
    $month_name = $p['month_name'] ?? null;
    $year_hebrew = $p['year_hebrew'] ?? null;

    $params = [];
    $where = ['a."משפחה" IS NOT NULL'];
    $i = 1;

    if ($group_name) {
        $where[] = 'k."שם" = $' . $i++;
        $params[] = $group_name;
    } elseif ($snif_id) {
        $where[] = 'k."סניף_id" = $' . $i++;
        $params[] = $snif_id;
    }

    $sql = 'SELECT a."אברך_id", a."משפחה", a."פרטי", a."קבוצה", k."סניף_id",
                   COALESCE(t."weekly_count", 0) AS weekly_count,
                   COALESCE(t."monthly_test", false) AS monthly_test
            FROM "אברכים" a
            JOIN "קבוצות" k ON a."קבוצה" = k."שם"
            LEFT JOIN test_summary t
              ON t."avrech_id" = a."אברך_id"
              AND t."month_name" = $' . $i++ . '
              AND t."year_hebrew" = $' . $i++ . '
            WHERE ' . implode(" AND ", $where) . '
            ORDER BY a."משפחה", a."פרטי"
            LIMIT 3000';

    $params[] = $month_name;
    $params[] = $year_hebrew;

    return queryasarray($sql, $params);
}

function getall_groups($p) {
    $sql = 'SELECT "מספר", "שם", "סניף_id" FROM "קבוצות" ORDER BY "שם"';
    return queryasarray($sql);
}

function getall_snifim($p) {
    return queryasarray('SELECT "סניף_id", "שם סניף" FROM "סניפים" ORDER BY "שם סניף"');
}

function getall_kvutzot($p)
{
    return queryasarray('SELECT "מספר", "שם" FROM "קבוצות" ORDER BY "שם"');
}
