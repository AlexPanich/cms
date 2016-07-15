<?php

namespace App\Http\Requests;

use App\Http\Requests\Request;

class FrontEditRequest extends Request
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'title' => 'sometimes|min:3',
            'name' => 'sometimes|min:3',
            'text' => 'sometimes|min:3',
            'content' => 'sometimes|min:10',
            'body' => 'sometimes|min:3'
        ];
    }
}
