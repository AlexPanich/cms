@extends('layouts.dashboard')

@section('title')
    Добавление меню
@endsection

@section('content')
    <h1>Создание нового меню</h1>
    @include('errors.list')
    <form class="" action="{{ route('add_menu') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="title">Название меня</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="pages">Добавить страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <select name="pages[]" id="pages" multiple>
                        @menu_tree($tree)
                    </select>
                </div>
            </div>
        </div>

        <input type="submit" value="Создать меню" class="btn btn-danger">
    </form>
@endsection