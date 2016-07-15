@extends('layouts.dashboard')

@section('title')
    Все шаблоны
@endsection

@section('content')
    <h3><a href="{{ route('create_template') }}">Создать шаблон</a></h3>
    <h1>Список шаблонов</h1>
    <table class="table table-hover">
        <thead>
        <th>Название</th>
        <th>Путь</th>
        <th>Редактировать</th>
        <th>Удалить</th>
        </thead>
        <tbody>
        @foreach($templates as $template)
            <tr>
                <td>{{ $template->name }}</td>
                <td>{{ $template->path }}</td>
                <td><a href="{{ route('edit_template', $template->id) }}">Редактировать</a></td>
                <td><a href="{{ route('delete_template', $template->id) }}">Удалить</a></td>
            </tr>
        @endforeach
        </tbody>
    </table>
@endsection