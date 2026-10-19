<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\SimpleEditInterface;
use App\Http\Requests\FrontEditRequest;

use App\Http\Requests;

class FrontEditController extends DashboardController
{
    public function getModel(Request $request, $className)
    {
        $class = '\App\\' .ucfirst($className);
        return $class::find($request->input('id'));
    }

    public function saveModel(FrontEditRequest $request, $className)
    {
        $class = '\App\\' . ucfirst($className);
        $model = $class::find($request->input('id'));

        if ($model instanceof SimpleEditInterface) {
            if ($model->simpleEdit($request->all())) {
                return $model;
            }
        }

        return ['error' => 'Ошибка программы'];
    }
}
