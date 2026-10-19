<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;


class UploadFileController extends Controller
{
    public function uploadDoc(Request $request, $answer = null)
    {
        //session_start();
        if(    !$request->session()->has('hash')
            || !$request->session()->has('name')
            || !$request->session()->has('uploaddir')) {
                return response('Wrong session.', 500);
        }

        $uploaddir = $request->session()->get('uploaddir');
        $name = $request->session()->get('name');

        if (preg_match("/^[0123456789abcdef]{32}$/i", $request->session()->get('hash'))) {
            if ($request->method() == 'GET') {
                if ($answer == "abort") {
                    if (is_file($uploaddir."/".$name.".html5upload")) unlink($uploaddir."/".$name.".html5upload");
                    print "ok abort";
                    $request->session()->forget(['name', 'hash', 'uploaddir']);
                    return;
                }

                if ($answer == "done") {
                    if (is_file($uploaddir."/".$name.".original"))
                        unlink($uploaddir."/".$name.".original");

                    rename($uploaddir."/".$name.".html5upload", $uploaddir."/".$name);
                    $request->session()->put('done', $name);
                    $request->session()->forget(['name', 'hash', 'uploaddir']);
                }
            }
            elseif ($request->method() == "POST"){

                $filename = $uploaddir . "/" . $name .  ".html5upload";

                if (intval($_SERVER["HTTP_PORTION_FROM"]) == 0)
                    $fout = fopen($filename,"wb");
                else
                    $fout = fopen($filename,"ab");

                if (!$fout) {
                    return response("Can't open file for writing.", 500);
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

            return response("ok\n", 200);
        }
        else {

            return response('Wrong session hash.', 500);
        }
    }
}
