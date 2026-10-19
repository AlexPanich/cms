@extends('layouts.dashboard')

@section('page_title')
    Шаблоны
@endsection

@section('content_title')
    Создание нового шаблона
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_template') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Имя</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name" value="{{ old('name') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="path">Путь</label>
            <div class="controls">
                <div class="input-prepend">
                    <select class="form-control" name="path" id="path">
                        @foreach($files as $file)
                            <option value="{{ $file }}">{{ $file }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
        </div>
        <br>
        <p>
            <input type="submit" value="Создать шаблон" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('all_templates') }}">Все шаблоны (уйти не сохранив)</a>
        </p>
    </form>
@endsection