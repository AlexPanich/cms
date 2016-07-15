<?php

namespace App\Http\Controllers;

use App\Helpers\Session;
use Illuminate\Http\Request;

use App\Http\Requests;

class UploadFileController extends Controller
{
    public function uploadDoc($answer = null)
    {
        session_start();
        if(!Session::has('hash') || !Session::has('name') || !Session::has('uploaddir')){
            header("HTTP/1.0 500 Internal Server Error");
            print "Wrong session hash.";
            die();
        }

        $uploaddir = Session::read('uploaddir');
        $name = Session::read('name');

        if (preg_match("/^[0123456789abcdef]{32}$/i", Session::read('hash'))) {
            if ($_SERVER["REQUEST_METHOD"] == "GET") {
                if ($answer == "abort") {
                    if (is_file($uploaddir."/".$name.".html5upload")) unlink($uploaddir."/".$name.".html5upload");
                    print "ok abort";
                    Session::kick(array('name', 'hash', 'uploaddir'));
                    return;
                }

                if ($answer == "done") {
                    if (is_file($uploaddir."/".$name.".original"))
                        unlink($uploaddir."/".$name.".original");

                    rename($uploaddir."/".$name.".html5upload", $uploaddir."/".$name);
                    Session::push('done', $name);
                    Session::kick(array('name', 'hash', 'uploaddir'));
                }
            }
            elseif ($_SERVER["REQUEST_METHOD"]=="POST"){

                $filename = $uploaddir . "/" . $name .  ".html5upload";

                if (intval($_SERVER["HTTP_PORTION_FROM"]) == 0)
                    $fout = fopen($filename,"wb");
                else
                    $fout = fopen($filename,"ab");

                if (!$fout) {
                    header("HTTP/1.0 500 Internal Server Error");
                    print "Can't open file for writing.";
                    return;
                }

                $fin = fopen("php://input", "rb");
                if ($fin) {
                    while (!feof($fin)) {
                        $data=fread($fin, 1024*1024);
                        fwrite($fout,$data);
                    }
                    fclose($fin);
                }

                fclose($fout);
            }

            header("HTTP/1.0 200 OK");
            print "ok\n";
        }
        else {
            header("HTTP/1.0 500 Internal Server Error");
            print "Wrong session hash.";
        }
    }
}
