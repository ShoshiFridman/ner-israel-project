<?php
$gdatabase='dev_s' ;
$fieldtypes=[];
function connect()
{
$user='postgres';
$pass='sh123';
$database=$GLOBALS['gdatabase'];
 return  pg_connect("host=localhost port=5432 dbname=$database user=$user password=$pass");
 //return  pg_connect("host=109.226.46.182 dbname=$database user=$user password=$pass");
 
}
function gettable($p,$q)
{
$a=explode(' ',$query);
if ($p=='ins')
$r=$a[1];
if ($p=='upd')
$r=$a[2];
return str_replace('"','',$r);

}

function loginsert($db,$query,$params=[])
{
pg_query_params($db,'insert into log (op,table,table_id,sql,op_user) 
VALUES ($1,$2,$3,$4,$5)',['insert',gettable('ins',$query),getid($query,$params),
getsql($query,$params),$_SESSION['["username"]']]);
}
function logupdate($db,$query,$params=[])
{

}

function addlog($db,$query,$params=[])
{
$a=trim(strtolower($query));
if (strpos($a,'insert')===0)
loginsert($query,$params);

if (strpos($a,'update')===0)
logupdate($query,$params);





}
/*דביר
function doq($query,$params=[])
{
 $db=connect();
//addlog($db,$query,$params);
 $query=str_replace('`','"',$query);
 return pg_query_params($db,$query,$params);// or die('Query failed: ' . pg_last_error());

}*/
//שינוי שלי
function doq($query, $params=[])
{
    $db = connect();
    $query = str_replace('`','"',$query);
    error_log("doq called with params: " . json_encode($params));

    $result = pg_query_params($db, $query, $params);
    if (!$result) {
        // להחזיר שגיאה מפורטת במקום false
        $err = pg_last_error($db);
        error_log("SQL error: $err -- Query: $query -- Params: " . json_encode($params));
        // אפשר להחזיר מערך עם שגיאה או להשליך חריגה (exception)
        throw new Exception("Database query error: $err");
    }
    return $result;
}

/*פונקציה של דביר
function doqinsert($query,$params=[])
{
 
 $query.=' returning id';
 return queryasarray($query)[0]['id'] ;
 //return pg_last_oid(doq($query,$params));// or die('Query failed: ' . pg_last_error());

}*/
//הפונקציה אחרי שינוי שלי
function doqinsert($query, $params=[])
{
    $query .= ' returning id';
    return queryasarray($query, $params)[0]['id'];
}

function queryasarray($query,$params=[],$returnfieldtype=false)
{
 $r=doq($query,$params);
 if ((!$r) || (pg_num_rows($r)==0))
 {return [];}
 
 else 
 {
 $r_array=pg_fetch_all($r);  
 $GLOBALS['fieldtypes']=[];
 for ($i=0;$i<pg_num_fields($r);$i++)
 $GLOBALS['fieldtypes'][pg_field_name($r,$i)]=pg_field_type($r,$i);
 if (!$returnfieldtype)
 return $r_array;
 $rslt['fieldtypes']=$GLOBALS['fieldtypes'];
 $rslt['table']=$r_array;
 return $rslt;
}
} 

function fieldnames($a)
{
return array_keys($a);
}
function getfields($query)
{
  return queryasarray($query);
}
//אני הוספתי
function queryasrow($sql, $params = []) {
    $rows = queryasarray($sql, $params);
    return $rows[0] ?? null;
}

?>